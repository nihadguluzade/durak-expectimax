import Card from "./Card";

class Player {

  private cards: Array<Card> = new Array<Card>();

  getCards() {
    return this.cards;
  }

  setCards(cards: Array<Card>) {
    this.cards = cards;
  }

}

export default Player;