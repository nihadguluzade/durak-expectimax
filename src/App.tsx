import React, {Component, ReactNode} from 'react';
import './App.css';
import Card from "./models/Card";
import {Suit} from "./models/Suit";
import {Rank} from "./models/Rank";
import Player from './models/Player';
import {Alert, Button, Modal} from "react-bootstrap";
import {cloneArray, shuffle} from "./utils";

enum GameState {
  NEW_GAME,
  WAITING_FOR_MOVE
}

class ComponentState {
  gameState: GameState = GameState.NEW_GAME;
  stack: Array<Card> | undefined;
  trump: Card | undefined;
  players: Array<Player> = new Array<Player>();
  desk: Array<Card> = new Array<Card>();
  errorAlert: string | undefined;
  side: Player | undefined;
  agent: Agent = Agent.OPPONENT;
  discarded: Array<Card> = new Array<Card>();
  winAlert: boolean = false;
  pause: boolean = false;
}

enum Agent {
  PLAYER,
  OPPONENT,
  CHANCE
}

enum Move {
  Attack = "attack",
  Defend = "defend",
  AttackOrDefend = "attackOrDefend",
  Take = "take",
  End_Round = "end"
}

class Board {
  desk: Card[];
  players: Player[];
  stack: Card[];
  discarded: Card[];

  constructor(desk: Card[], players: Player[], stack: Card[], discarded: Card[]) {
    this.desk = desk;
    this.players = players;
    this.stack = stack;
    this.discarded = discarded;
  }

  clone() {
    let newDesk = new Array<Card>();
    let newPlayers = new Array<Player>();
    let newStack = new Array<Card>();
    let newDiscarded = new Array<Card>();

    const arrs = [this.desk, this.stack, this.discarded];

    for (let i = 0; i < this.players.length; i++) {
      const cards: Card[] = this.players[i].getCards();
      newPlayers[i] = new Player();
      for (let j = 0; j < cards.length; j++) {
        if (cards[j] != undefined) {
          newPlayers[i].getCards()[j] = new Card(cards[j].getRank(), cards[j].getSuit());
        }
      }
    }

    for (let i = 0; i < arrs.length; i++) {
      for (let j = 0; j < arrs[i].length; j++)
      {
        if (arrs[i] == this.desk) {
          // @ts-ignore
          newDesk[j] = arrs[i][j];
        } else if (arrs[i] == this.stack) {
          // @ts-ignore
          newStack[j] = arrs[i][j];
        } else if (arrs[i] == this.discarded) {
          // @ts-ignore
          newDiscarded[j] = arrs[i][j];
        }
      }
    }

    return new Board(newDesk, newPlayers, newStack, newDiscarded);
  }
}

class App extends Component<any, ComponentState> {

  state: ComponentState = new ComponentState();

  private initialDepth: number = -1;

  private moveQualities: Array<{score: number, move: Move, card?: Card}> = new Array<{score: number; move: Move; card?: Card}>();

  private agents: Agent[] = [Agent.PLAYER, Agent.CHANCE, Agent.OPPONENT, Agent.CHANCE];

  getPossibleOpponentCards = (stack: Card[], opponentCards: Card[]) => {
    stack.splice(0 ,1);
    return shuffle(stack.concat(opponentCards));
  }

  playBestMove = () => {
    const {players} = this.state;
    const move: {move: Move, card?: Card} | undefined = this.determineBestMove();
    console.log("made move:", move);

    if (move == undefined) {
      console.log("undefined move");

    } else if (move.move == Move.AttackOrDefend && move.card != undefined) {
      this.go(players[this.getPlayer()], move.card);

    } else if (move.move == Move.Take) {
      this.take();

    } else if (move.move == Move.End_Round) {
      this.endRound();
    }
  }

  determineBestMove = (): {move: Move, card?: Card} | undefined => {
    const {desk, players, stack, discarded} = this.state;

    // const opponentCards = this.getPossibleOpponentCards(cloneArray(stack!), players[1].getCards());
    const opponentCards = players[this.getOpponent()].getCards();
    const board = new Board(desk, [players[this.getPlayer()], new Player(opponentCards)], stack!, discarded);
    const depth = 2;
    const side = this.getPlayer();

    let newBoard = board.clone();
    this.expectimax(newBoard, depth, Agent.PLAYER, side);

    console.log("Possible Moves", this.moveQualities);
    let bestScore = -9999;
    let bestMove = undefined;
    let maxMoveCard = undefined;
    for (let i = 0; i < this.moveQualities.length; i++) {
      if (this.moveQualities[i].score > bestScore) {
        bestScore = this.moveQualities[i].score;
        bestMove = this.moveQualities[i].move;
        maxMoveCard = this.moveQualities[i].card;
      }
    }
    console.log("Best Move", bestScore, bestMove, maxMoveCard);
    return {move: bestMove!, card: maxMoveCard};
  }

  expectimax = (board: Board, depth: number, agent: Agent, side: Agent) => {

    if (this.initialDepth == -1) this.initialDepth = depth;

    if (depth == 0) {
      const finalScore = this.getFinalScore(board, side);
      console.debug("Reached Depth:", finalScore);
      return finalScore;
    }

    const moves = [Move.AttackOrDefend, Move.Take, Move.End_Round];

    if (agent == Agent.PLAYER) {
      const moveQuality: Array<{score: number, move: Move, card?: Card}> = new Array<{score: number; move: Move; card?: Card}>();

      for (let i = 0; i < moves.length; i++) {
        const playerCards = board.players[this.getPlayer()].getCards();

        if (moves[i] == Move.AttackOrDefend) {
          for (let j = 0; j < playerCards.length; j++) {
            let newBoard = board.clone()
            const card = playerCards[j];

            if (!this.validateMove(newBoard.desk, card))
              continue;

            newBoard = this.simulateMove(Move.AttackOrDefend, newBoard, this.getPlayer(), card);
            let newScore: number = this.expectimax(newBoard, depth - 1, Agent.OPPONENT, this.flipSide(side));
            moveQuality.push({score: newScore, move: Move.AttackOrDefend, card: card});
            console.debug("Final Score (player attack/defend):", newScore, newBoard);
          }

        } else if (moves[i] == Move.Take) {
          let newBoard = board.clone();

          if (!this.validateTake(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.Take, newBoard, this.getPlayer());
          let newScore = this.getFinalScore(newBoard, side);
          moveQuality.push({score: newScore, move: Move.Take});
          console.debug("Final Score (player take):", newScore, newBoard);

        } else if (moves[i] == Move.End_Round) {
          let newBoard = board.clone();

          if (!this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.End_Round, newBoard);
          let newScore = this.getFinalScore(newBoard, side);
          moveQuality.push({score: newScore, move: Move.End_Round});
          console.debug("Final Score (player end round):", newScore, newBoard);
        }
      }

      if (depth == this.initialDepth) {
        this.moveQualities = this.cloneMoves(moveQuality);
      }

      return this.max(moveQuality);

    } else if (agent == Agent.OPPONENT) {
      const moveQuality = [];

      for (let i = 0; i < moves.length; i++) {
        const opponentCards = board.players[this.getOpponent()].getCards();

        if (moves[i] == Move.AttackOrDefend) {
          for (let j = 0; j < opponentCards.length; j++) {
            const card = opponentCards[j];
            let newBoard = board.clone();

            if (!this.validateMove(newBoard.desk, card))
              continue;

            newBoard = this.simulateMove(Move.AttackOrDefend, newBoard, this.getOpponent(), card);
            let newScore: number = this.expectimax(newBoard, depth - 1, Agent.PLAYER, this.flipSide(side));
            moveQuality.push(newScore);
            console.debug("Final Score (opponent attack/defend):", newScore, newBoard);
          }

        } else if (moves[i] == Move.End_Round) {
          let newBoard = board.clone();

          if (!this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.End_Round, newBoard);
          let newScore = this.getFinalScore(newBoard, side);
          moveQuality.push(newScore);
          console.debug("Final Score (opponent end round):", newScore, newBoard);

        } else if (moves[i] == Move.Take) {
          let newBoard = board.clone();

          if (!this.validateTake(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.Take, newBoard, this.getOpponent());
          let newScore = this.getFinalScore(newBoard, side);
          moveQuality.push(newScore);
          console.debug("Final Score (opponent take):", newScore, newBoard);
        }
      }

      return this.average(moveQuality, board.players[this.getOpponent()].getCards().length);
    }

    return 0;
  }

  average = (values: number[], len: number): number => {
    let sum = 0;
    let coefficientSum = 0;
    for (let i = 0; i < values.length; i++) {
      let coefficient = 1 / len;
      sum += values[i] * coefficient;
      coefficientSum += coefficient;
    }
    return sum / coefficientSum;
  }

  min = (values: number[]): number => {
    let min = 9999;
    for (let i = 0; i < values.length; i++)
      if (values[i] < min)
        min = values[i];
    return min;
  }

  max = (values: any): number => {
    let max = -9999;
    for (let i = 0; i < values.length; i++)
      if (values[i].score > max)
        max = values[i].score;
    return max;
  }

  cloneMoves = (arr: Array<any>): Array<any> => {
    let newArray: Array<{score: number, move: Move, card?: Card}> = new Array<{score: number; move: Move; card?: Card}>();
    for (let i = 0; i < arr.length; i++) {
      newArray[i] = {
        score: arr[i].score,
        move: arr[i].move,
        card: arr[i].card
      };
    }
    return newArray;
  }

  isSuitExists = (cards: Card[], index: number) => {
    const suit = cards[index].getSuit();
    for (let i = 0; i < index; i++) {
      if (cards[i].getSuit() == suit)
        return true;
    }
    return false;
  }

  isHighRankExists = (cards: Card[], index: number) => {
    const suit = cards[index].getSuit();
    const rank = parseInt(cards[index].getRank());
    const highRankCards = [];
    let exists = false;

    for (let i = 0; i < index; i++) {
      if (cards[i].getSuit() == suit && parseInt(cards[i].getRank()) > rank) {
        if (!exists) exists = true;
        highRankCards.push(i);
      }
    }

    if (exists) {
      return {exist: true, places: highRankCards};
    }
    return {exist: false, places: undefined};
  }

  getFinalScore = (board: Board, side: Agent, final = false) => {
    const playerCards = board.players[!final ? this.getPlayer() : 0].getCards();
    let totalScore = 0;

    for (let i = 0; i < playerCards.length; i++) {
      const card = playerCards[i];

      if (card.getSuit() == this.state.trump!.getSuit()) {
        totalScore += 25;
      } else {
        if (i > 5) {
          const highCond = this.isHighRankExists(playerCards, i);

          if (highCond.exist && highCond.places != undefined) {
            for (let j = 0; j < highCond.places.length; j++) {
              totalScore = totalScore - (parseInt(playerCards[highCond.places[j]].getRank())) - (parseInt(playerCards[i].getRank()) * 0.5);
            }
          } else {
            totalScore += (parseInt(playerCards[i].getRank()) * 0.5);
          }

        } else {
          totalScore += parseInt(playerCards[i].getRank());
        }
      }
    }

    if (board.stack.length < 5 && playerCards.length > 6) {
      totalScore -= 80;
    }

    return totalScore;
  }

  simulateMove = (move: Move, board: Board, playerIndex?: number, card?: Card) => {
    if (move == Move.AttackOrDefend) {
      if (card != undefined && playerIndex != undefined) {
        board.desk.push(card);
        board.players[playerIndex].getCards().splice(board.players[playerIndex].getCards()
          .findIndex(c => c.getRank() == card.getRank() && c.getSuit() == card.getSuit()), 1);
      }

    } else if (move == Move.Take) {
      if (playerIndex != undefined) {
        while (board.desk.length != 0) board.players[playerIndex].getCards().push(board.desk.pop()!);
      }

    } else if (move == Move.End_Round) {
      while (board.desk.length != 0) board.discarded.push(board.desk.pop()!);
    }

    return board;
  }

  validateTake = (desk: Card[]): boolean => {
    return desk.length > 0 && desk.length % 2 != 0;
  }

  validateTakeOrEndRound = (desk: Card[]): boolean => {
    return desk.length > 0 && desk.length % 2 == 0;
  }

  getOpponent = (): Agent => {
    const {agent} = this.state;
    if (agent == Agent.PLAYER) return Agent.OPPONENT;
    return Agent.PLAYER;
  }

  getPlayer = (): Agent => {
    return this.state.agent;
  }

  flipSide = (side: Agent): Agent => {
    if (side == Agent.PLAYER) return Agent.OPPONENT;
    return Agent.PLAYER;
  }

  /* GRAPHICS */

  renderCards = (player: Player): ReactNode => {
    return (
      <div className="section">
        <div className="cards-container">
          {player.getCards().map((card: Card, index: number) => {
            if (card != undefined) {
              return (
                <div key={index} className="card-wrapper">
                  <button className="btn btn-outline-light"
                          disabled={this.state.side != player}
                          onClick={() => this.go(player, card)}>
                    <img src={card.getImage()} className="game-card-img" alt={card.toString()}/>
                  </button>
                </div>
              );
            }
          })}
        </div>
      </div>
    )
  }

  renderDesk = (): ReactNode => {
    const {desk} = this.state;
    const cards: Array<ReactNode> = new Array<ReactNode>();
    const stacks: Array<ReactNode> = new Array<ReactNode>();
    let leftPos = -15;

    desk.map((card: Card, index: number) => {
      if (index % 2 == 1) {
        leftPos += 15;
      }

      cards.push(
        <img src={card.getImage()}
             className="game-card-img"
             style={{left: leftPos}}
             key={index}
             alt={card.toString()}/>
      );
    });

    for (let i = 0; i < cards.length; i++) {
      if (i % 2 == 0) {
        stacks.push(
          <div key={i} className="stacked-desk-cards">
            {cards[i]}
            {i + 1 < cards.length && cards[i + 1]}
          </div>
        );
      }
    }

    return (
      <div id="Desk" className="desk">
        <div className="stack-wrapper">
          {stacks}
        </div>
        {desk.length > 0 && (desk.length % 2 == 0 ? (
          <button className="btn btn-sm btn-outline-primary mt-4" onClick={this.endRound}>
            End Round
          </button>
        ) : (
          <Button variant="outline-danger" size="sm" className="mt-4" onClick={this.take}>Take</Button>
        ))}
      </div>
    )
  }

  endRound = (): void => {
    const {desk, discarded} = this.state;
    while (desk.length != 0) discarded.push(desk.pop()!);
    this.setState({desk, discarded});
    this.switchSide();
  }

  take = (): void => {
    const {side, players, desk} = this.state;
    const player: Player | undefined = players.find(p => p == side);
    if (player != undefined) {
      while (desk.length != 0) player.getCards().push(desk.pop()!);
      this.setState({desk, players});
      this.switchSide();
    }
  }

  switchSide = (): void => {
    const {side, players, pause} = this.state;
    this.drawCard(players[this.getPlayer()]);
    this.drawCard(players[this.getOpponent()]);
    if (side == players[0]) {
      this.setState({side: players[1], agent: Agent.OPPONENT}, () => {
        // setTimeout(this.playBestMove, 1500);
      });
    } else {
      this.setState({side: players[0], agent: Agent.PLAYER}, () => {
        setTimeout(this.playBestMove, 1000);
      });
    }
  }

  renderDiscarded = (): ReactNode => {
    const {discarded} = this.state;
    let degree = -30;
    return (
      <div className="discarded-container">
        {discarded.map((card: Card, index: number) => {
          degree += 15;
          return (
            <img src="assets/cards/card_back.svg" 
                 key={index}
                 className="game-card-img" 
                 style={{transform: `rotate(${degree}deg)`}}
                 alt="closed card" />
          )
        })}
      </div>
    )
  }

  renderStack = (): ReactNode => {
    const {trump, stack, players} = this.state;
    if (trump != undefined && stack != undefined) {
      return (
        <div className="stack-container">
          {stack.length > 0 && (
            <img src={trump.getImage()}
                 className="game-card-img"
                 style={{transform: `rotate(-90deg)`}}
                 alt="trump card" />
          )}
          {stack.length > 2 && (
            <img src="assets/cards/card_back.svg" className="game-card-img" alt="stack" />
          )}
          <span style={{
            position: 'absolute',
            top: '43%',
            right: 0
          }}>Cards: {stack.length}</span>
          <Button variant="outline-secondary"
                  size="sm"
                  className="pl-3 pr-3"
                  style={{position: 'absolute', top: 0}}
                  onClick={() => this.drawCard(players[0])}>Draw</Button>
          <Button variant="outline-secondary"
                  size="sm"
                  className="pl-3 pr-3"
                  style={{position: 'absolute', bottom: 0}}
                  onClick={() => this.drawCard(players[1])}>Draw</Button>
        </div>
      )
    } else {
      console.error("trump is undefined");
    }
  }

  drawCard = (player: Player): void => {
    const {players, stack, desk} = this.state;

    const _player: Player = players.find(p => p == player)!;

    if (stack == undefined || _player == undefined) return;

    if (desk.length > 0) {
      this.setState({errorAlert: "No drawing in the middle of round"});
      return;
    }

    if (stack.length == 0) {
      this.setState({errorAlert: "No cards left"});
      return;
    }

    if (_player.getCards().length >= 6) {
      this.setState({errorAlert: "Already have 6 or more cards"});
      return;
    }

    while (_player.getCards().length < 6) {
      _player.getCards().push(stack.pop()!);
    }

    this.setState({players, stack, errorAlert: undefined});
  }

  initializeStack = (): Array<Card> => {
    const stack: Array<Card> = new Array<Card>();
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        stack.push(new Card(rank, suit));
      }
    }
    return shuffle(stack);
  }

  startNewGame = (): void => {
    const players: Array<Player> = [new Player(), new Player()];
    const stack: Array<Card> = this.initializeStack();
    const trump: Card = stack[0];

    let stackLen = stack.length;
    for (let i = 0, j = 0; i < 12; i++, i == 6 && j++) {
      let randomCard: Card = stack[Math.floor(Math.random() * stackLen)];
      while (randomCard.equals(trump)) {
        randomCard = stack[Math.floor(Math.random() * stackLen)];
      }
      players[j].getCards().push(randomCard);
      stack.splice(stack.findIndex(x => x == randomCard), 1);
      stackLen--;
    }

    console.log("trump ->", trump);
    console.log("players[0] ->", players[0]);
    console.log("players[1] ->", players[1]);
    console.log("stack ->", stack);

    this.setState({ gameState: GameState.WAITING_FOR_MOVE, players, stack, trump, side: players[1] }, () => {
      // setTimeout(this.playBestMove, 10000);
    });
  }

  validateMove = (board: Card[], card: Card, showErrors = false): boolean => {
    const {trump} = this.state;

    if (board.length == 0) return true;

    const possibleRanks: Array<Rank> = new Array<Rank>();
    const lastPlayedCard: Card = board[board.length - 1];

    board.forEach(card => possibleRanks.push(card.getRank()));

    if (trump == undefined) return false;

    console.debug(board, card, trump);
    if (card.getSuit() == trump.getSuit()) {
      if (board.length % 2 == 1) {
        if (lastPlayedCard.getSuit() == trump.getSuit() && parseInt(card.getRank()) < parseInt(lastPlayedCard.getRank())) {
          showErrors && this.setState({errorAlert: "Low trump rank"});
          return false;
        } else {
          return true;
        }
      }
    } else if (board.length % 2 == 1 && lastPlayedCard.getSuit() == trump.getSuit() && card.getSuit() != trump.getSuit()) {
      showErrors && this.setState({errorAlert: "Low rank"});
      return false;
    }

    if (board.length % 2 == 1) {
      if (card.getSuit() != lastPlayedCard.getSuit()) {
        showErrors && this.setState({errorAlert: "Incompatible suits"})
        return false;
      }

      if (parseInt(card.getRank()) < parseInt(lastPlayedCard.getRank())) {
        showErrors && this.setState({errorAlert: "Rank is low"})
        return false;
      }
    } else {
      if (!possibleRanks.includes(card.getRank())) {
        showErrors && this.setState({errorAlert: "Incompatible card"});
        return false;
      }
    }

    return true;
  }

  go = (player: Player, card: Card): void => {
    const {desk, players, stack} = this.state;

    if (desk.length == 0 && stack!.length != 0 && (players[0].getCards().length < 6 || players[1].getCards().length < 6)) {
      this.setState({errorAlert: "Draw cards first"});
      return;
    }

    if (!this.validateMove(desk, card, true)) return;

    player.getCards().splice(player.getCards()
      .findIndex(c => c.getRank() == card.getRank() && c.getSuit() == card.getSuit()), 1);
    desk.push(card);
    this.setState({desk, errorAlert: undefined});
    if (player.getCards().length == 0) {
      this.final();
      return;
    }
    this.switchSide();
  }

  final = () => {
    const {desk, players, stack, discarded} = this.state;
    const board = new Board(desk, [players[0], players[1]], stack!, discarded);
    console.log("Final", this.getFinalScore(board, Agent.PLAYER, true));
    this.setState({winAlert: true});
  }

  render() {
    const {gameState, players, errorAlert, winAlert, pause} = this.state;
    let currentPage;

    switch (gameState) {
      case GameState.NEW_GAME:
        currentPage = (
          <div className="App-header container">
            <button className="btn btn-outline-secondary" 
                    onClick={this.startNewGame}>
              start game
            </button>
          </div>
        );
        break;
      case GameState.WAITING_FOR_MOVE:
        currentPage = (
          <div className="App-header container">
            <div className="row">
              {this.renderCards(players[0])}
            </div>
            <div className="row">
              <div>
                {this.renderDiscarded()}
              </div>
              <div style={{width: 550}}>
                {this.renderDesk()}
              </div>
              <div>
                {this.renderStack()}
              </div>
            </div>
            <div className="row">
              {this.renderCards(players[1])}
            </div>
{/*            <div className="row">
              <Button onClick={() => this.setState({pause: !pause}, this.switchSide)}>{!pause ? "Pause": "Play"}</Button>
            </div>*/}
          </div>
        );
        break;
      default:
        currentPage = (
          <span>DEFAULT_STATE</span>
        );
    }

    return (
      <div className="App">
        {errorAlert != undefined && errorAlert.length > 0 && (
            <Alert variant="danger" onClose={() => this.setState({errorAlert: undefined})} dismissible>
              {errorAlert}
            </Alert>
        )}
        <Modal show={winAlert} onHide={() => this.setState({winAlert: false})}>
          <Modal.Body><span style={{fontSize: 20}}>Game Ended!</span></Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => this.setState({winAlert: false})}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        {currentPage}
      </div>
    )
  }

}

export default App;
