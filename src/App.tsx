import React, {Component, ReactNode} from 'react';
import './App.css';
import Card from "./models/Card";
import {Suit} from "./models/Suit";
import {Rank} from "./models/Rank";

class State {}

class App extends Component<any, State> {

  state: State = new State();

  opponentCards: Array<Card> = [
    new Card(Rank.SEVEN, Suit.SPADES),
    new Card(Rank.NINE, Suit.CLUBS),
    new Card(Rank.JACK, Suit.HEARTS),
    new Card(Rank.SIX, Suit.CLUBS),
    new Card(Rank.NINE, Suit.DIAMONDS),
  ];

  playerCards: Array<Card> = [
    new Card(Rank.KING, Suit.CLUBS),
    new Card(Rank.QUEEN, Suit.SPADES),
    new Card(Rank.EIGHT, Suit.SPADES),
    new Card(Rank.ACE, Suit.DIAMONDS),
    new Card(Rank.ACE, Suit.HEARTS),
  ];

  desk: Map<number, Array<Card>> = new Map([
    [0, [new Card(Rank.QUEEN, Suit.CLUBS), new Card(Rank.TEN, Suit.CLUBS)]],
    [1, [new Card(Rank.SIX, Suit.DIAMONDS), new Card(Rank.SEVEN, Suit.DIAMONDS)]],
  ]);

  discarded: Array<Card> = [
    new Card(Rank.SIX, Suit.CLUBS),
    new Card(Rank.SIX, Suit.DIAMONDS),
  ];

  trump: Card = new Card(Rank.ACE, Suit.DIAMONDS);

  stack: Array<Card> = [
    new Card(Rank.SIX, Suit.CLUBS),
    new Card(Rank.SIX, Suit.DIAMONDS),
    new Card(Rank.SIX, Suit.HEARTS),
    new Card(Rank.SIX, Suit.SPADES),
    new Card(Rank.SEVEN, Suit.CLUBS),
    new Card(Rank.SEVEN, Suit.DIAMONDS),
    new Card(Rank.SEVEN, Suit.HEARTS),
    new Card(Rank.SEVEN, Suit.SPADES),
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
    const cards: Array<ReactNode> = new Array<ReactNode>();
    const keyIterator: IterableIterator<number> = this.desk.keys();
    let key = keyIterator.next();
    while (!key.done) {
      let leftPos = -15;
      cards.push(
        <div key={key.value} className="stacked-desk-cards">
          {this.desk.get(key.value)!.map((card, index) => {
            leftPos += 15;
            return (
              <img src={card.getImage()} 
                 className="game-card-img" 
                 style={{left: leftPos}}
                 key={index} 
                 alt={card.toString()}/>
            );
          })}
        </div>
      );
      key = keyIterator.next();
    }

    return (
      <div className="desk">
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
                 className="game-card-img" 
                 style={{transform: `rotate(${degree}deg)`}}
                 alt="closed card" />
          )
        })}
      </div>
    )
  }

  renderStack = (): ReactNode => {
    return (
      <div className="stack-container">
        <img src={this.trump.getImage()}
             className="game-card-img"
             style={{transform: `rotate(90deg)`}}
             alt="trump card" />
        {this.stack.length > 2 && (
          <img src="assets/cards/card_back.svg" className="game-card-img" alt="stack" />
        )}
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        <div className="App-header container">
          <div className="row">
            {this.renderCards(this.opponentCards)}
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
            {this.renderCards(this.playerCards)}
          </div>
        </div>
      </div>
    )
  }

}

export default App;
