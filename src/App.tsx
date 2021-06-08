import React, {Component, ReactNode} from 'react';
import './App.css';
import Card from "./models/Card";
import {Suit} from "./models/Suit";
import {Rank} from "./models/Rank";
import Player from './models/Player';
import {Alert, Button} from "react-bootstrap";

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
  move: Player = this.players[0];
  discarded: Array<Card> = new Array<Card>();
}

class App extends Component<any, ComponentState> {

  state: ComponentState = new ComponentState();

  renderCards = (player: Player): ReactNode => {
    return (
      <div className="section">
        <div className="cards-container">
          {player.getCards().map((card: Card, index: number) => {
            return (
              <div key={index} className="card-wrapper">
                <button className="btn btn-outline-light"
                        disabled={this.state.move != player}
                        onClick={() => this.go(player, card, index)}>
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

  switchMove = (): void => {
    const {move, players} = this.state;
    if (move == players[0]) {
      this.setState({move: players[1]});
    } else {
      this.setState({move: players[0]});
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

  shuffle = (array: Array<any>): Array<any> => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  initializeStack = (): Array<Card> => {
    const stack: Array<Card> = new Array<Card>();
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        stack.push(new Card(rank, suit));
      }
    }
    return this.shuffle(stack);
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

  validateGo = (card: Card): boolean => {
    const {desk, trump} = this.state;

    if (desk.length == 0) return true;

    const possibleRanks: Array<Rank> = new Array<Rank>();
    const lastPlayedCard: Card = desk[desk.length - 1];

    desk.forEach(card => possibleRanks.push(card.getRank()));

    if (trump == undefined) return false;

    if (card.getSuit() == trump.getSuit()) {
      if (desk.length % 2 == 1) {
        if (lastPlayedCard.getSuit() == trump.getSuit() && parseInt(card.getRank()) < parseInt(lastPlayedCard.getRank())) {
          this.setState({errorAlert: "Low trump rank"});
          return false;
        } else {
          return true;
        }
      }
    } else if (desk.length % 2 == 1 && lastPlayedCard.getSuit() == trump.getSuit() && card.getSuit() != trump.getSuit()) {
      this.setState({errorAlert: "Low rank"});
      return false;
    }

    if (desk.length % 2 == 1) {
      if (card.getSuit() != lastPlayedCard.getSuit()) {
        this.setState({errorAlert: "Incompatible suits"})
        return false;
      }

      if (parseInt(card.getRank()) < parseInt(lastPlayedCard.getRank())) {
        this.setState({errorAlert: "Rank is low"})
        return false;
      }
    } else {
      if (!possibleRanks.includes(card.getRank())) {
        this.setState({errorAlert: "Incompatible card"});
        return false;
      }
    }

    return true;
  }

  go = (player: Player, card: Card, index: number): void => {
    const {desk, players, stack} = this.state;

    if (desk.length == 0 && stack!.length != 0 && (players[0].getCards().length < 6 || players[1].getCards().length < 6)) {
      this.setState({errorAlert: "Draw cards first"});
      return;
    }

    if (!this.validateGo(card)) return;

    player.getCards().splice(index, 1);
    desk.push(card);
    this.setState({desk});
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
