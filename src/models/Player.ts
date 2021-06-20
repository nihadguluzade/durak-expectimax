import Card from "./Card";

class Player {

  private cards: Array<Card>;

  constructor(cards?: Card[]) {
    this.cards = cards || new Array<Card>();
  }

  getCards() {
    return this.cards;
  }

  setCards(cards: Array<Card>) {
    this.cards = cards;
  }

}

export default Player;