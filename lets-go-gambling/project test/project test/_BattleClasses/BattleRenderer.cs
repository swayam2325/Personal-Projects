using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using project_test._UtilityClasses;
using System;
using System.Collections.Generic;
using System.Linq;
//using System.Numerics;

//using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace project_test._BattleClasses
{
    internal class BattleRenderer
    {
        private Texture2D profiles;
        private SpriteFont font;
        private Texture2D pixel;

        internal BattleRenderer(Texture2D profiles, SpriteFont font, Texture2D pixel)
        {
            this.profiles = profiles;
            this.font = font;
            this.pixel = pixel;
        }

        //Uses helper methods to render the hi-res layer of the battle
        internal void Draw(SpriteBatch _spriteBatch, BattleManager battle, Player player, Player enemy, List<Button> buttons)
        {
            player.animatedHand.Draw(_spriteBatch);
            enemy.animatedHand.Draw(_spriteBatch);
            _spriteBatch.Draw(pixel, new Rectangle(0, 0, 810, 240), Color.DarkSlateGray);
            _spriteBatch.Draw(pixel, new Rectangle(0, 0, 205, 240), new Color(0, 42, 82));
            _spriteBatch.Draw(pixel, new Rectangle(605, 0, 210, 240), new Color(0, 42, 82));

            player.Draw(_spriteBatch, profiles, new Vector2(0, 0), 1, Color.White);
            enemy.Draw(_spriteBatch, profiles, new Vector2(610, 0), 1, Color.White);

            DrawHealthBar(_spriteBatch, new Rectangle(0, 210, 200, 20), player, Color.Blue);
            Utility.drawFittedText(_spriteBatch, font, $"{player.hp}/{player.maxHP}", new Rectangle(0, 212, 200, 20), Color.White);
            Utility.drawFittedText(_spriteBatch, font, $"{player.Name}", new Rectangle(0, 244, 200, 30), Color.White);

            DrawHealthBar(_spriteBatch, new Rectangle(610, 210, 200, 20), enemy, Color.Red);
            Utility.drawFittedText(_spriteBatch, font, $"{enemy.hp}/{enemy.maxHP}", new Rectangle(610, 212, 200, 20), Color.White);
            Utility.drawFittedText(_spriteBatch, font, $"{enemy.Name}", new Rectangle(610, 244, 200, 30), Color.White);

            if (enemy.Name == "Dr. Chip") {Utility.drawFittedText(_spriteBatch, font, $"Your Deck: {player.Deck.name}", new Rectangle(200, 244, 410, 30), Color.White);}
            if (enemy.Name == "Mr. H") { Utility.drawFittedText(_spriteBatch, font, $"The House Always Wins. Give Up.", new Rectangle(200, 244, 410, 30), Color.White); }
            
            if (enemy.Name == "Slotty" && battle.bossactionCounter >= 1) { Utility.drawFittedText(_spriteBatch, font, $"Lucky 7's! Take 2 damage per 7.", new Rectangle(200, 244, 410, 30), Color.White); }

            DrawScores(_spriteBatch, player, enemy, battle.Bust, battle);

            DrawBattleStatus(_spriteBatch,battle,enemy);

            switch(battle.state)
            {
                case BattleState.roundEnd:
                    if (!battle.battleOver()) { buttons[2].Draw(_spriteBatch); }
                    else if (battle.player.hp <= 0) { buttons[3].Draw(_spriteBatch); }
                    else { Utility.drawFittedText(_spriteBatch, font, $"Press SPACE to Continue", new Rectangle(305, 400, 200, 75), Color.White); }
                        buttons[0].Draw(_spriteBatch);
                    buttons[1].Draw(_spriteBatch);
                    //buttons[2].Draw(_spriteBatch);
                    break;
                default:
                    buttons[0].Draw(_spriteBatch);
                    buttons[1].Draw(_spriteBatch);
                    break;

            }
        }
        private void DrawHealthBar(SpriteBatch _spriteBatch, Rectangle position, Player player, Color barColor)
        {
            //draws healthbar
            float percentage = (float)player.hp / player.maxHP;
            if (percentage < 0)
            {
                percentage = 0;
            }
            int healthWidth = (int)(position.Width * percentage);
            _spriteBatch.Draw(pixel, position, Color.Black);
            _spriteBatch.Draw(pixel, new Rectangle(position.X, position.Y, healthWidth, position.Height), barColor);
        }
        private void DrawScores(SpriteBatch _spriteBatch, Player player, Player enemy, int bustValue, BattleManager battle)
        {
            //Draws player score
            string playerText = player.getScore(bustValue).ToString();
            Color playerColor = Color.White;
            if (enemy.Name == "Cameraman" && !(battle.state == BattleState.counting || battle.state == BattleState.roundEnd)) { playerText = "???";}
            else if (player.getScore(bustValue) > bustValue) { playerText = "BUST!"; playerColor = Color.Red; }
            else if (player.getScore(bustValue) == bustValue) { playerText = "BLACKJACK!"; playerColor = Color.Yellow; }
            Utility.drawFittedText(_spriteBatch, font, playerText, new Rectangle(210, 160, 195, 50), playerColor);

            //Draws enemy score
            string enemyText = enemy.getScore(bustValue).ToString();
            Color enemyColor = Color.White;
            if (enemy.Name == "Cameraman" && !(battle.state == BattleState.counting || battle.state == BattleState.roundEnd)) { enemyText = "???"; }
            else if (enemy.getScore(bustValue) > bustValue) { enemyText = "BUST!"; enemyColor = Color.Red; }
            else if (enemy.getScore(bustValue) == bustValue) { enemyText = "BLACKJACK!"; enemyColor = Color.Yellow; }
            Utility.drawFittedText(_spriteBatch, font, enemyText, new Rectangle(405, 160, 195, 50), enemyColor);
        }
        private void DrawBattleStatus(SpriteBatch _spriteBatch, BattleManager battle, Player enemy)
        {
            //Draw "Stood" text
            if (battle.playerStood) { Utility.drawFittedText(_spriteBatch, font, "stood", new Rectangle(210, 200, 195, 30), Color.DarkGoldenrod); }
            if (battle.enemyStood) { Utility.drawFittedText(_spriteBatch, font, "stood", new Rectangle(405, 200, 195, 30), Color.DarkGoldenrod); }
            
            //Draws victory message
            if (battle.battleOver())
            {
                if (battle.player.hp > 0)
                {
                    Utility.drawFittedText(_spriteBatch, font, "THE HOUSE IS BLEEDING", new Rectangle(210, 20, 390, 60), Color.Yellow);
                    Utility.drawFittedText(_spriteBatch, font, "VICTORY", new Rectangle(210, 80, 390, 50), Color.Yellow);
                }
                else
                {
                    Utility.drawFittedText(_spriteBatch, font, "THE HOUSE ALWAYS WINS", new Rectangle(210, 20, 390, 60), Color.Red);
                    Utility.drawFittedText(_spriteBatch, font, "DEFEAT", new Rectangle(210, 80, 390, 50), Color.Red);
                }
            }
            //Draws Mid-UI text
            else
            {
                switch (battle.state)
                {
                    case BattleState.playerTurn:
                        Utility.drawFittedText(_spriteBatch, font, $"Playing to {battle.Bust}", new Rectangle(210, 20, 390, 60), Color.Red);
                        //Utility.drawFittedText(_spriteBatch, font, "L Click: Hit / R Click: Stand", new Rectangle(210, 80, 390, 50), Color.White);
                        if (enemy.Name == "Darcy") { Utility.drawFittedText(_spriteBatch, font, $"{enemy.Name} stands on 17 + ({Math.Abs(17 - battle.Stand)})", new Rectangle(210, 80, 390, 50), Color.White); }
                        else { Utility.drawFittedText(_spriteBatch, font, $"{enemy.Name} stands on {battle.Stand}", new Rectangle(210, 80, 390, 50), Color.White); }
                        //Utility.drawFittedText(_spriteBatch, font, $"{enemy.Name} stands on {battle.Stand}", new Rectangle(210, 80, 390, 50), Color.White);
                        break;
                    case BattleState.enemyTurn:
                        Utility.drawFittedText(_spriteBatch, font, $"{enemy.Name} is thinking...", new Rectangle(210, 50, 390, 60), Color.Orange);
                        break;
                    case BattleState.roundEnd:
                        if (enemy.Name == "Darcy") { Utility.drawFittedText(_spriteBatch, font, $"Stand Value Re-Rolled!", new Rectangle(200, 244, 410, 30), Color.White); }
                        if (enemy.Name == "Mr. House") { Utility.drawFittedText(_spriteBatch, font, $"Mr. House bleeds out..", new Rectangle(200, 244, 410, 30), Color.White); }
                        /*if (enemy.Name == "Mr. House") { Utility.drawFittedText(_spriteBatch, font, "House bleeds out..", new Rectangle(210, 90, 390, 60), battle.wincolor); }
                        else { Utility.drawFittedText(_spriteBatch, font, battle.Winner, new Rectangle(210, 90, 390, 60), battle.wincolor); } */
                        Utility.drawFittedText(_spriteBatch, font, battle.Winner, new Rectangle(210, 90, 390, 60), battle.wincolor);
                        int playerscore = battle.player.getScore(battle.Bust);
                        if (playerscore > battle.Bust) playerscore = 0;
                        int enemyscore = battle.enemy.getScore(battle.Bust);
                        if (enemyscore > battle.Bust) enemyscore = 0;
                        string damagedealt = Math.Abs((playerscore - enemyscore)).ToString();
                        //string damagedealt = battle.Winner.Contains("Draw")? "0" : (Math.Abs(battle.player.getScore(battle.Bust) - battle.enemy.getScore(battle.Bust))).ToString();
                        Utility.drawFittedText(_spriteBatch, font, damagedealt + " Damage Dealt!", new Rectangle(210, 30, 390, 60), Color.White);
                        //Utility.drawFittedText(_spriteBatch, font, "Press SPACE for next round", new Rectangle(210, 30, 390, 60), Color.White);
                        break;
                }
            }
        }
    }
}
