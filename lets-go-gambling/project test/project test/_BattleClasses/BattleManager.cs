using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using project_test._BattleClasses;
using project_test._UtilityClasses;
using System;
using System.Collections.Generic;
//using System.Drawing;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace project_test
{
    internal enum BattleState
    {
        playerTurn,
        enemyTurn,
        counting,
        roundEnd,
    }
    internal class BattleManager
    {

        internal BattleState state;
        //private BattleState previous;
        private int enemyFrameCounter = 0;
        internal int Bust {  get; private set; }
        internal Player player { get; private set; }
        internal Player enemy { get; private set; }
        internal bool playerStood = false;
        internal bool enemyStood = false;
        internal int Stand { get; private set; }
        internal string Winner;
        internal Color wincolor = Color.White;
        private bool bossaction;
        internal int bossactionCounter = 0;
        

        //sets up and initializes battle
        internal BattleManager(Player player, Player enemy, int Bust, int Stand)
        {
            this.Bust = Bust;
            this.player = player;
            this.enemy = enemy;
            this.Stand = Stand;
            state = BattleState.playerTurn;
            if (enemy.Name == "Darcy" || enemy.Name == "Mr. House") { bossaction = true; }
        }

        //updates everything battle-related
        internal void Update(GameTime gameTime, KeyboardState kstate, KeyboardState previous, Vector2 mouseposition, List<Button> buttons)
        {
            player.animatedHand.Update(gameTime);
            enemy.animatedHand.Update(gameTime);
            foreach (Card c in player.Hand)
            {
                c.Update(gameTime);
            }
            foreach (Card c in enemy.Hand)
            {
                c.Update(gameTime);
            }
            if (battleOver())
            {
                if (player.hp <= 0)
                {
                    buttons[3].Update(gameTime, mouseposition);
                }
            }
            if (!battleOver())
            {
                switch (state)
                {
                    case BattleState.playerTurn:
                        buttons[0].Update(gameTime, mouseposition);
                        buttons[1].Update(gameTime, mouseposition);
                        //Extra player logic?
                        break;

                    case BattleState.enemyTurn:
                        enemyFrameCounter++;
                        //This delays the enemy ai (so it looks like it's thinking)
                        if (enemyFrameCounter >= 45)
                        {
                            EnemyTurn();
                            enemyFrameCounter = 0;
                        }
                        break;

                    case BattleState.counting:
                        count();
                        break;

                    case BattleState.roundEnd:
                        
                        buttons[2].Update(gameTime, mouseposition);
                        //if (kstate.IsKeyDown(Keys.Space) && previous.IsKeyUp(Keys.Space))
                            //resetCards();
                        break;
                }
            }
        }
        /// <summary>
        /// Player Hits
        /// </summary>
        internal void PlayerHit()
        {
            if (state != BattleState.playerTurn || playerStood) { return; }

            //animation
            player.animatedHand.goTo(HandState.Hit, new Vector2(-80, 500));


            player.Hand.Add(player.Deck.drawCard());

            if (player.getScore(Bust) >= Bust) { playerStood = true; state = BattleState.enemyTurn; }

            else { state = BattleState.enemyTurn; }
        }
        /// <summary>
        /// Player Stands
        /// </summary>
        internal void playerStand()
        {
            if (state != BattleState.playerTurn) {  return; }
            //animation
            player.animatedHand.goTo(HandState.Stand, new Vector2(-40, 400));

            playerStood = true;
            state = BattleState.enemyTurn;
        }
        /// <summary>
        /// Enemy's turn / runs enemy "AI"
        /// </summary>
        internal void EnemyTurn()
        {
            doBossAction();
            if (state!= BattleState.enemyTurn)
            {
                return;
            }
            //THIS IS WHERE STAND VALUE WOULD CHANGE
            if (enemy.getScore(Bust) < Stand && !enemyStood)
            {
                //animation
                enemy.animatedHand.goTo(HandState.Hit, new Vector2(470, 500));

                enemy.Hand.Add(enemy.Deck.drawCard());
                //CHANGE STAND VALUE
                if (enemy.getScore(Bust) >= Stand)
                {
                    enemyStood = true;
                }
            }
            else
            {
                //animation
                enemy.animatedHand.goTo(HandState.Stand, new Vector2(430, 400));

                enemyStood = true;
            }
            if (enemy.Name == "Dr. Chip" || enemy.Name == "Slotty") { doBossAction(); }
            //transition to next state
            if (playerStood && enemyStood)
            {
                state = BattleState.counting;
            }
            else if (!playerStood)
            {
                state = BattleState.playerTurn;
            }    
        }

        /// <summary>
        /// Deals round damage and ends round
        /// </summary>
        internal void count()
        {
            if (state != BattleState.counting)
            {
                return;
            }
            int playerscore = player.getScore(Bust);
            if (playerscore > Bust) playerscore = 0;
            int enemyscore = enemy.getScore(Bust);
            if (enemyscore > Bust) enemyscore = 0;
            int diff = playerscore - enemyscore;

            if (playerscore > enemyscore)
            {
                enemy.ModifyHealth(-diff);
                Winner = "Player wins hand!";
                wincolor = Color.Yellow;
                //enemy.hp -= diff;
            }
            else if (playerscore < enemyscore)
            {
                player.ModifyHealth(-Math.Abs(diff));
                Winner = $"{enemy.Name} wins hand.";
                wincolor = Color.Red;
                //player.hp -= Math.Abs(diff);
            }
            else
            {
                Winner = "-Draw-";
                wincolor = Color.Blue;
            }
            //transition to next state
            state = BattleState.roundEnd;
        }

        //goes to the next round. resets cards and anything else needed.
        internal void resetCards()
        {
            if (state != BattleState.roundEnd) { return; }
            player.Hand.Clear();
            enemy.Hand.Clear();
            playerStood = false;
            enemyStood = false;
            player.Deck.endRound();
            enemy.Deck.endRound();
            bossaction = false;
            bossactionCounter = 0;
            doBossAction();
            state = BattleState.playerTurn;
        }

        //returns true if the battle is done.
        internal bool battleOver()
        {
            return (player.hp <= 0 || enemy.hp <= 0);
        }

        //Handles the boss-specific actions for each battle.
        internal void doBossAction()
        {
            switch (enemy.Name)
            {
                case "Mr. H":

                    break;
                case "Mr. House":
                    if (!bossaction)
                    {
                        enemy.ModifyHealth(-10);
                        bossaction = true;
                    }
                    break;
                case "Player":

                    break;
                case "Slotty":
                    int count7 = 0;
                    foreach (Card c in enemy.Hand)
                    {
                        if (c.rank == "Lucky") { count7++; }
                    }
                    count7--;
                    count7 -= bossactionCounter;
                    if (count7 > 0) 
                    { 
                        bossactionCounter++;
                        for (int i = 0; i < count7 + 1; i++)
                        {
                            player.ModifyHealth(-2);
                        }
                    }
                    break;
                case "Dr. Chip":
                    int count = 0;
                    foreach (Card c in enemy.Hand)
                    {
                        if (c.rank == "Potion") { count++; }
                    }
                    if (count > bossactionCounter) { bossactionCounter++; player.Deck.randomDeck(); }
                    //player.Deck.randomDeck();
                    break;
                case "Darcy":
                    if (!bossaction)
                    {
                        bossaction = true;
                        Stand = 17 + Utility.random.Next(1,7);
                    }

                    break;
                case "Cameraman":
                    foreach (Card c in enemy.Hand)
                    {
                        if (Utility.random.Next(1,11) < 6) { c.flip(); }
                    }
                    break;
                case "Rue Lette":

                    break;
                case "Martin E.":

                    break;
            }
        }

        //Sets up pre-determined battle based on the battleNum
        internal BattleManager SetBattle(int num, Texture2D handsprites)
        {
            Deck pDeck = new Deck("Standard Deck");
            pDeck.standardDeck();
            Player newPlayer = new Player("Player", pDeck, 75);
            newPlayer.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(-100, 550), Color.Teal, false));

            int bustValue;
            int standValue;

            Deck eDeck;
            Player newEnemy;
            switch (num)
            {
                case 1:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.sevenDeck();
                    newEnemy = new Player("Slotty", eDeck, 20);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.AntiqueWhite, true));
                    bustValue = 21;
                    standValue = 17;
                    break;
                case 2:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.diceDeck();
                    newEnemy = new Player("Darcy", eDeck, 30);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.Yellow, true));
                    bustValue = 25;
                    standValue = 19;
                    break;
                case 3:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.chipDeck();
                    newEnemy = new Player("Dr. Chip", eDeck, 40);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.CornflowerBlue, true));
                    bustValue = 35;
                    standValue = 30;
                    break;
                case 4:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.cameraDeck();
                    newEnemy = new Player("Cameraman", eDeck, 50);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.Gray, true));
                    bustValue = 50;
                    standValue = 43;
                    break;
                case 5:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.standardDeck();
                    newEnemy = new Player("Rue Lette", eDeck, 60);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.RosyBrown, true));
                    bustValue = 36;
                    standValue = 30;
                    break;
                case 6:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.standardDeck();
                    newEnemy = new Player("Martin E.", eDeck, 70);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.CadetBlue, true));
                    bustValue = 12;
                    standValue = 9;
                    break;
                case 7:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.houseDeck();
                    newEnemy = new Player("Mr. H", eDeck, 1);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.SaddleBrown, true));
                    bustValue = 21;
                    standValue = 21;
                    break;
                case 8:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.housebrokenDeck();
                    newEnemy = new Player("Mr. House", eDeck, 100);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.SaddleBrown, true));
                    bustValue = 21;
                    standValue = 21;
                    break;
                default:
                    eDeck = new Deck("Enemy Deck");
                    eDeck.standardDeck();
                    newEnemy = new Player("Unknown", eDeck, 75);
                    newEnemy.setAnimatedHand(new AnimatedHand(handsprites, new Vector2(490, 550), Color.White, true));
                    bustValue = 21;
                    standValue = 17;
                    break;
            }
            return new BattleManager(newPlayer, newEnemy, bustValue, standValue);
        }
    }
}
