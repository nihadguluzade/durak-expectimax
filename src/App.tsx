import React, {Component, ReactNode} from 'react';
import './App.css';
import Card from "./models/Card";
import {Suit} from "./models/Suit";
import {Rank} from "./models/Rank";
import Player from './models/Player';
import {Alert, Button} from "react-bootstrap";
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
  move: Player | undefined;
  discarded: Array<Card> = new Array<Card>();
}

enum Agent {
  PLAYER,
  OPPONENT
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
        newPlayers[i].getCards()[j] = new Card(cards[j].getRank(), cards[j].getSuit());
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

  getPossibleOpponentCards = (stack: Card[], opponentCards: Card[]) => {
    stack.splice(0 ,1);
    return shuffle(stack.concat(opponentCards));
  }

  playBestMove = () => {
    const {players} = this.state;
    const move: {move: Move, card?: Card} | undefined = this.determineBestMove();
    console.log("move:", move);

    if (move == undefined) {
      console.log("undefined move");

    } else if (move.move == Move.AttackOrDefend && move.card != undefined) {
      this.go(players[0], move.card);

    } else if (move.move == Move.Take) {
      this.take();

    } else if (move.move == Move.End_Round) {
      this.endRound();
    }
  }

  determineBestMove = (): {move: Move, card?: Card} | undefined => {
    const {desk, players, stack, discarded} = this.state;

    let bestMove: {move: Move, card?: Card} | undefined;
    let bestScore = -1;

    const moves = [Move.AttackOrDefend, Move.Take, Move.End_Round];
    const playerCards = players[0].getCards();
    // const opponentCards = this.getPossibleOpponentCards(stack!, players[1].getCards());
    const opponentCards = players[1].getCards();
    const board = new Board(desk, [players[0], new Player(opponentCards)], stack!, discarded);
    const depth = 2;

    for (let i = 0; i < moves.length; i++) {
      if (moves[i] == Move.AttackOrDefend) {
        for (let j = 0; j < playerCards.length; j++) {
          let newBoard = board.clone();
          const card = playerCards[j];

          if (!this.validateMove(newBoard.desk, card))
            continue;

          newBoard = this.simulateMove(Move.AttackOrDefend, newBoard, 0, card);
          let newScore = this.expectimax(newBoard, depth, Agent.OPPONENT);

          if (newScore == undefined)  {
            console.log("undefined");
            return undefined;
          }

          if (newScore > bestScore) {
            bestMove = {move: Move.AttackOrDefend, card};
            bestScore = newScore;
          }
        }

      } else if (moves[i] == Move.Take) {
        let newBoard = board.clone();

        if (this.validateTakeOrEndRound(newBoard.desk))
          continue;

        newBoard = this.simulateMove(Move.Take, newBoard, 0);
        let newScore = this.getFinalScore(newBoard);

        if (newScore > bestScore) {
          bestMove = {move: Move.Take};
          bestScore = newScore;
        }

      } else if (moves[i] == Move.End_Round) {
        let newBoard = board.clone();

        if (!this.validateTakeOrEndRound(newBoard.desk))
          continue;

        newBoard = this.simulateMove(Move.End_Round, newBoard);
        let newScore = this.getFinalScore(newBoard);

        if (newScore > bestScore) {
          bestMove = {move: Move.End_Round};
          bestScore = newScore;
        }
      }
    }

    return bestMove;
  }

  expectimax = (board: Board, depth: number, agent: Agent) => {

    if (depth == 0) {
      return this.getFinalScore(board);
    }

    if (agent == Agent.PLAYER) {
      let score = 0;

      const moves = [Move.AttackOrDefend, Move.Take, Move.End_Round];

      for (let i = 0; i < moves.length; i++) {
        const playerCards = board.players[0].getCards();

        if (moves[i] == Move.AttackOrDefend) {
          for (let j = 0; j < playerCards.length; j++) {
            let newBoard = board.clone()
            const card = playerCards[j];

            if (!this.validateMove(newBoard.desk, card))
              continue;

            newBoard = this.simulateMove(Move.AttackOrDefend, newBoard, 0, card);
            let newScore = this.expectimax(newBoard, depth - 1, Agent.OPPONENT);

            if (newScore == undefined)  {
              console.log("undefined");
              return -1;
            }

            if (newScore > score)
              score = newScore;
          }

        } else if (moves[i] == Move.Take) {
          let newBoard = board.clone();

          if (this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.Take, newBoard, 0);
          let newScore = this.getFinalScore(newBoard);

          if (newScore > score)
            score = newScore;

        } else if (moves[i] == Move.End_Round) {
          let newBoard = board.clone();

          if (!this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.End_Round, newBoard);
          let newScore = this.getFinalScore(newBoard);

          if (newScore > score)
            score = newScore;
        }
      }

      return score;

    } else if (agent == Agent.OPPONENT) {
      let totalScore = 0;

      const moves = [Move.AttackOrDefend, Move.End_Round, Move.Take];

      for (let i = 0; i < moves.length; i++) {
        const opponentCards = board.players[1].getCards();

        if (moves[i] == Move.AttackOrDefend) {
          for (let j = 0; j < opponentCards.length; j++) {
            const card = opponentCards[j];
            let newBoard = board.clone();

            if (!this.validateMove(newBoard.desk, card))
              continue;

            newBoard = this.simulateMove(Move.AttackOrDefend, newBoard, 1, card);
            let newScore = this.expectimax(newBoard, depth - 1, Agent.PLAYER);

            if (newScore == undefined)  {
              console.log("undefined");
              return -1;
            }

            totalScore += ((1 / opponentCards.length) * newScore);
          }

        } else if (moves[i] == Move.End_Round) {
          let newBoard = board.clone();

          if (!this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.End_Round, newBoard);
          let newScore = this.getFinalScore(newBoard);
          totalScore += newScore;

        } else if (moves[i] == Move.Take) {
          let newBoard = board.clone();

          if (this.validateTakeOrEndRound(newBoard.desk))
            continue;

          newBoard = this.simulateMove(Move.Take, newBoard, 1);
          let newScore = this.getFinalScore(newBoard);
          totalScore += newScore;
        }

      }

      return totalScore / 2;
    }

    return undefined;
  }

  getFinalScore = (board: Board) => {
    let totalScore = 0;

    const playerCards = board.players[0].getCards();

    for (let i = 0; i < playerCards.length; i++) {
      const card = playerCards[i];

      if (card.getSuit() == this.state.trump!.getSuit()) {
        totalScore += 15;
      } else {
        totalScore += parseInt(playerCards[i].getRank());
      }

      // penalty
      if (i >= 6) {
        totalScore -= 2;
      }
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

  /** take is the opposite of end round */
  validateTakeOrEndRound = (desk: Card[]): boolean => {
    return desk.length > 0 && desk.length % 2 == 0;
  }

  renderCards = (player: Player): ReactNode => {
    return (
      <div className="section">
        <div className="cards-container">
          {player.getCards().map((card: Card, index: number) => {
            return (
              <div key={index} className="card-wrapper">
                <button className="btn btn-outline-light"
                        disabled={this.state.move != player}
                        onClick={() => this.go(player, card)}>
                  <img src={card.getImage()} className="game-card-img" alt={card.toString()} />
                </button>
              </div>
            );
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
          <button className="btn btn-sm btn-outline-primary mt-4" onClick={this.endRound}>End Round</button>
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
    this.switchMove();
  }

  take = (): void => {
    const {move, players, desk} = this.state;
    const player: Player | undefined = players.find(p => p == move);
    if (player != undefined) {
      while (desk.length != 0) player.getCards().push(desk.pop()!);
      this.setState({desk, players});
      this.switchMove();
    }
  }

  /** players[0] - ai, players[1] - human */
  switchMove = (): void => {
    const {move, players} = this.state;
    if (move == players[0]) {
      this.setState({move: players[1]});
    } else {
      this.setState({move: players[0]}, () => {
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
          <img src={trump.getImage()}
               className="game-card-img"
               style={{transform: `rotate(-90deg)`}}
               alt="trump card" />
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

    _player.getCards().push(stack.pop()!);
    this.setState({players, stack});
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

    this.setState({ gameState: GameState.WAITING_FOR_MOVE, players, stack, trump, move: players[1] });
  }

  validateMove = (board: Card[], card: Card, showErrors = false): boolean => {
    const {trump} = this.state;

    if (board.length == 0) return true;

    const possibleRanks: Array<Rank> = new Array<Rank>();
    const lastPlayedCard: Card = board[board.length - 1];

    board.forEach(card => possibleRanks.push(card.getRank()));

    if (trump == undefined) return false;

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
    this.switchMove();
  }

  /* drag is not working properly */
  handleListeners = (): void => {
    const containers: Element[] = Array.from(document.querySelectorAll('.cards-container'));
    const dropZone: HTMLElement | null = document.getElementById("Desk");
    
    if (containers != null && dropZone != null) {
      const {players} = this.state;

      containers.forEach(parentDiv => {
        const images: HTMLCollection = parentDiv.getElementsByClassName("game-card-img");

        if (images.length > 0) {
          Array.from(images).forEach((img: Element, index: number) => {

            let draggedCard: any;

            img.addEventListener("drag", function(e) {
              console.log("drag", e!.target!);
            }, false);

            // prevent these to make drop work
            dropZone.addEventListener("dragenter", (e: any) => {
              e.preventDefault();
            }, false);

            dropZone.addEventListener("dragover", (e: any) => {
              e.preventDefault();
            }, false);

            img.addEventListener("dragstart", function (e: any) {
              draggedCard = e.target;
              console.log("dragstart", draggedCard.alt);
              e.target.style.opacity = 0.5;
            }, false);

            dropZone.addEventListener("drop", (e: any) => {
              e.preventDefault();

              if (draggedCard != undefined) {
                const rank: string = draggedCard.alt.split("of")[0].trim();
                const suit: string = draggedCard.alt.split("of")[1].trim();
                console.log("drop", rank, suit);

                players.forEach((player: Player) => {
                  const card: Card | undefined = player.getCards().find(c => c.getRank() == rank && c.getSuit() == suit);
                  if (card != undefined) {
                    const cardIndex = player.getCards().findIndex(c => c == card);
                    const {desk} = this.state;

                    player.getCards().splice(cardIndex, 1);
                    desk.push(card);

                    this.setState({desk});
                  }
                })
              }
            });

            img.addEventListener("dragend", function(e: any) {
              e.target.style.opacity = "";
            }, false);

          });
        }
      });
    }
  }

  render() {
    const {gameState, players, errorAlert} = this.state;
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
        {currentPage}
      </div>
    )
  }

}

export default App;
