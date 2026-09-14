using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using project_test._BattleClasses;
using System;
using System.Collections.Generic;
using System.Linq;
//using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace project_test
{
    internal class Player
    {
        private string name;
        private Deck deck;
        private List<Card> hand = new List<Card>();
        internal Color Color;
        internal int hp;
        internal int maxHP;
        internal bool enemy = false;
        internal int standValue = 0;
        internal AnimatedHand animatedHand;
        private Rectangle sourceRect;
            
        internal string Name { get { return name; } }
        internal Deck Deck {  get { return deck; } }
        internal List<Card> Hand { get { return hand; } }

        //Sets up the players profile icon and board color.
        internal Player(string name, Deck deck, int hp)
        {
            this.name = name;
            this.deck = deck;
            this.hp = hp;
            maxHP = hp;
            sourceRect = new Rectangle(0, 0, 200, 200);
            switch (name)
            {
                case "Mr. H":
                    sourceRect.X = 1400;
                    Color = Color.Salmon;
                    break;
                case "Mr. House":
                    sourceRect.X = 1600;
                    Color = Color.DarkGreen;
                    break;
                case "Player":
                    sourceRect.X = 0;
                    Color = Color.Teal;
                    break;
                case "Slotty":
                    sourceRect.X = 200;
                    Color = Color.Teal;
                    break;
                case "Dr. Chip":
                    sourceRect.X = 400;
                    Color = Color.LightCoral;
                    break;
                case "Darcy":
                    sourceRect.X = 600;
                    Color = Color.Goldenrod;
                    break;
                case "Cameraman":
                    sourceRect.X = 800;
                    Color = Color.LightSlateGray;
                    break;
                case "Rue Lette":
                    sourceRect.X = 1000;
                    Color = Color.LightGreen;
                    break;
                case "Martin E.":
                    sourceRect.X = 1200;
                    Color = Color.CornflowerBlue;
                    break;
                default:
                    sourceRect.X = 1800;
                    Color = Color.DarkGreen;
                    break;
            }
        }

        internal void setAnimatedHand(AnimatedHand hand)
        {
            animatedHand = hand;
        }

        //gets score based on a bust value. takes into account aces
        //if ace makes score go above bust, it counts as 1. otherwise it counts as 11 
        internal int getScore(int Bust)
        {
            int temp = 0;
            int aces = 0;
            foreach (Card card in hand)
            {
                if (card.ace)
                {
                    aces++;
                }
                temp += card.value;
            }
            while (temp > Bust && aces > 0)
            {
                temp -= 10;
                aces--;
            }
            return temp;
        }

        internal void ModifyHealth(int health)
        {
            hp += health;
            if (hp < 0)
            {
                hp = 0;
            }
        }

        public void Draw(SpriteBatch spriteBatch, Texture2D spritesheet, Vector2 position, float scale = 1.0f, Color color = default)
        {
            // Drasw the card
            spriteBatch.Draw(
                spritesheet,
                position,
                sourceRect,
                color,
                0f,
                Vector2.Zero,
                scale,
                SpriteEffects.None,
                0f
            );
        }

        //Draws all of the players cards. handles positioning
        public void DrawCards(SpriteBatch _spriteBatch, Texture2D cardSprites, Vector2 position)
        {
            int x = (int)position.X;
            int y = (int)position.Y;
            int count = 0;

            if (hand.Count > 10)
            {
                foreach (Card c in Hand)
                {
                    c.Draw(_spriteBatch, cardSprites, new Vector2(x - 1, y), 1, Color.Gray);
                    //c.Draw(_spriteBatch, cardSprites, new Vector2(x, y - 1), 1, Color.Gray);
                    c.Draw(_spriteBatch, cardSprites, new Vector2(x, y), 1, Color.White);
                    x += 9;
                    //if you want to increase diagonally
                    //y += 5;
                    count++;
                    if (count >= 5)
                    {
                        x = (int)position.X;
                        //standard value 47
                        y += 30;
                        count = 0;
                    }
                }
            }
            else
            {
                foreach (Card c in Hand)
                {
                    c.Draw(_spriteBatch, cardSprites, new Vector2(x - 1, y), 1, Color.Gray);
                    c.Draw(_spriteBatch, cardSprites, new Vector2(x, y - 1), 1, Color.Gray);
                    c.Draw(_spriteBatch, cardSprites, new Vector2(x, y), 1, Color.White);
                    x += 9;
                    //if you want to increase diagonally
                    y += 5;
                    count++;
                    if (count >= 5)
                    {
                        x = (int)position.X;
                        //standard value 47
                        y += 40;
                        count = 0;
                    }
                }
            }  
        }
    }
}
