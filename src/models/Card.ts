import {Suit} from "./Suit";
import {Rank} from "./Rank";

class Card {
  private readonly rank: Rank;
  private readonly suit: Suit;

  constructor(rank: Rank, suit: Suit) {
    this.rank = rank;
    this.suit = suit;
  }

  getImage(): string {
    return `assets/cards/${this.rank.valueOf()}_of_${this.suit.toLowerCase()}.svg`;
  }

  getRank() {
    return this.rank;
  }

  getSuit() {
    return this.suit;
  }

  toString() {
    return `${this.rank} of ${this.suit}`;
  }

  equals(card: Card) {
    return this.rank == card.rank && this.suit == card.suit;
  }
}

export default Card;
