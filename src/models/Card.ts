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
    return `assets/cards/${this.rank}_of_${this.suit.toLowerCase()}.svg`;
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
}

export default Card;
