import React, {Component, ReactNode} from 'react';
import './App.css';
import Card from "./models/Card";
import {Suit} from "./models/Suit";
import {Rank} from "./models/Rank";
import Player from './models/Player';

class ComponentState {
  gameState: GameState = GameState.NEW_GAME;
  stack: Array<Card> | undefined;
  trump: Card | undefined;
  players: Array<Player> = new Array<Player>();
  // desk: Map<number, Array<Card>> = new Map();
  desk: Array<Card> = new Array<Card>();
  fakyu: string[] = new Array<string>();
}

enum GameState {
  NEW_GAME,
  WAITING_FOR_MOVE
}

class App extends Component<any, ComponentState> {

  state: ComponentState = new ComponentState();

  _desk: Map<number, Array<Card>> = new Map([
    [0, [new Card(Rank.QUEEN, Suit.CLUBS), new Card(Rank.TEN, Suit.CLUBS)]],
    [1, [new Card(Rank.SIX, Suit.DIAMONDS), new Card(Rank.SEVEN, Suit.DIAMONDS)]],
  ]);

  discarded: Array<Card> = [
    new Card(Rank.SIX, Suit.CLUBS),
    new Card(Rank.SIX, Suit.DIAMONDS),
  ];

  renderCards = (player: Array<Card>): ReactNode => {
    return (
      <div className="section">
        <div className="cards-container">
          {player.map((card: Card, index: number) => {
            return (
              <div key={index} className="card-wrapper">
                <img src={card.getImage()} className="game-card-img" alt={card.toString()} />
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
    // const keyIterator: IterableIterator<number> = desk.keys();

    // let key = keyIterator.next();
    // while (!key.done) {
    //   let leftPos = -15;
    //   cards.push(
    //     <div key={key.value} className="stacked-desk-cards">
    //       {desk.get(key.value)!.map((card, index) => {
    //         leftPos += 15;
    //         return (
    //           <img src={card.getImage()} 
    //              className="game-card-img" 
    //              style={{left: leftPos}}
    //              key={index} 
    //              alt={card.toString()}/>
    //         );
    //       })}
    //     </div>
    //   );
    //   key = keyIterator.next();
    // }

    return (
      <div id="Desk" className="desk">
        {cards}
      </div>
    )
  }

  renderDiscarded = (): ReactNode => {
    let degree = -30;
    return (
      <div className="discarded-container">
        {this.discarded.map((card: Card, index: number) => {
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
    const {trump, stack} = this.state;
    if (trump != undefined && stack != undefined) {
      return (
        <div className="stack-container">
          <img src={trump.getImage()}
               className="game-card-img"
               style={{transform: `rotate(90deg)`}}
               alt="trump card" />
          {stack.length > 2 && (
            <img src="assets/cards/card_back.svg" className="game-card-img" alt="stack" />
          )}
        </div>
      )
    } else {
      console.error("trump is undefined");
    }
  }

  initializeStack = (): Array<Card> => {
    const stack: Array<Card> = new Array<Card>();
    for (const suit of Object.values(Suit)) {
      for (const rank of Object.values(Rank)) {
        stack.push(new Card(rank, suit));
      }
    }
    console.log("stack is initialized.");
    return stack;
  }

  startNewGame = (): void => {
    const players: Array<Player> = [new Player(), new Player()];
    const stack: Array<Card> = this.initializeStack();
    const trump: Card = stack[Math.floor(Math.random() * stack.length)];

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

    this.setState({ gameState: GameState.WAITING_FOR_MOVE, players, stack, trump }, this.handleListeners);
  }

  handleListeners = (): void => {
    const containers: Element[] = Array.from(document.querySelectorAll('.cards-container'));
    const dropZone: HTMLElement | null = document.getElementById("Desk");
    
    if (containers != null && dropZone != null) {
      const {players} = this.state;
      const that = this;

      containers.forEach(parentDiv => {
        const images: HTMLCollection = parentDiv.getElementsByClassName("game-card-img");

        if (images.length > 0) {
          Array.from(images).forEach((img: Element, index: number) => {

            let draggedCard: any;

            img.addEventListener("drag", function(e) {});

            // prevent these to make drop work
            dropZone.addEventListener("dragenter", (e: any) => {
              e.preventDefault();
            }, false);

            dropZone.addEventListener("dragover", (e: any) => {
              e.preventDefault();
            }, false);

            img.addEventListener("dragstart", function (e: any) {
              draggedCard = e.target;
              e.target.style.opacity = 0.5;
            }, false);

            dropZone.addEventListener("drop", (e: any) => {
              e.preventDefault();
              // const {desk} = that.state;

              if (draggedCard != undefined) {
                const rank: string = draggedCard.alt.split("of")[0].trim();
                const suit: string = draggedCard.alt.split("of")[1].trim();

                players.forEach((player: Player) => {
                  const card: Card | undefined = player.getCards().find(c => c.getRank() == rank && c.getSuit() == suit);

                  if (card != undefined) {
                    const cardIndex = player.getCards().findIndex(c => c == card);
                    const {desk} = this.state;

                    if (desk == undefined) {
                      console.log('undefined', desk);
                      let _desk = this.state.desk;
                      this.setState({desk: _desk}, () => {console.log("after", this.state.desk)});
                    } else {
                      let _desk = this.state.desk;
                      this.setState({desk: _desk}, () => {console.log("after", this.state.desk)});
                    }

                    player.getCards().splice(cardIndex, 1);
  
                    // if (Object.keys(_desk).length == 0) {
                    //   _desk.set(102, [card]);
                    // } else {
                    //   _desk.forEach((value: Array<Card>, key: number) => {
                    //     console.log(key, value);
                    //   });
                    // }

                    const fucuk = this.state.fakyu;
                    fucuk.push('sad');
                    this.setState({fakyu: fucuk});
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
    const {gameState, players, desk} = this.state;
    let currentPage;
    console.log("render", desk);

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
              {this.renderCards(players[0].getCards())}
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
              {this.renderCards(players[1].getCards())}
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
        {currentPage}
      </div>
    )
  }

}

export default App;
