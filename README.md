# Durak Game AI with Expectimax

This is an classical two player durak game that can be played with AI implemented with Expectimax algorithm. Launched as an web project and done in the scope of the Artificial Intelligence Course (BLM4510 Yapay Zeka) at YTU. It is the standart react app so to build and run it simply execute the command `npm start` or `yarn start`. Set the `AIvsAI` state to true to make AIs play between each other.

### Results

I run 20 games, which 10 of them was between player vs ai and the other 10 was between ai vs ai. Half of these games, 5 in first set, other 5 in second set, AI won. So AI wins every other game which is a pretty good result.

### Drawbacks

The AI does not differentiate between the trump cards, which is important factor at the end of the game. This is because of the evaluation function where every trump card is worth 25 score, no matter what the rank is.

### References

[https://habr.com/ru/post/263259/](https://habr.com/ru/post/263259/)

[https://habr.com/ru/post/261189/](https://habr.com/ru/post/261189/)

[https://www.baeldung.com/cs/2048-algorithm](https://www.baeldung.com/cs/2048-algorithm)

[https://github.com/DanijelAskov/expectiminimax-backgammon](https://github.com/DanijelAskov/expectiminimax-backgammon)
