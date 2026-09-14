using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework;
using System;
using System.Collections.Generic;
using System.Data.Common;
//using System.Drawing;
using System.Linq;
//using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace project_test
{
    internal class Card
    {
        internal string suit;
        internal int value;
        internal string rank;
        internal bool ace = false;
        internal bool flipped;

        private int updatetime = 0;
        private Rectangle sourceRect;

        private const int cardheight = 45;
        private const int cardwidth = 33;
        
        public override string ToString()
        {
            return $"{rank} of {suit}";
        }

        //Constructor sets up the values for all non-standard cards
        internal Card(string suit, string rank)
        {
            this.suit = suit;
            this.rank = rank;
            switch (rank)
            {
                case "Jack":
                    this.value = 10;
                    break;
                case "King":
                    this.value = 10;
                    break;
                case "Queen":
                    this.value = 10;
                    break;
                case "Ace":
                    ace = true;
                    this.value = 11;
                    break;
                case "Lucky":
                    this.value = 7;
                    break;
                case "Dice":
                    this.value = 1;
                    break; ;
                case "Chips":
                    this.value = 15;
                    break;
                case "Potion":
                    this.value = 0;
                    break;
                case "Camera":
                    this.value = 0;
                    break;
                case "Spinner":
                    this.value = 18;
                    break;
                case "Martini":
                    this.value = 0;
                    break;
                case "House":
                    this.value = 21;
                    break;
                case "Housebroken":
                    this.value = 21;
                        break; ;
                default:
                    this.value = int.Parse(rank);
                    break;
            }

            sourceRect = new Rectangle(
                1 + 0 * (cardwidth + 2),
                1 + 0 * (cardheight + 2),
                cardwidth,
                cardheight
                );
        }

        internal void flip()
        {
            if (flipped)
            {
                flipped = false;
                sourceRect = new Rectangle(
                1 + column * (cardwidth + 2),
                1 + row * (cardheight + 2),
                cardwidth,
                cardheight
                );
            }
            else
            {
                flipped = true;
                sourceRect = new Rectangle(
                1 + 0 * (cardwidth + 2),
                1 + 0 * (cardheight + 2),
                cardwidth,
                cardheight
                );
            }
        }

        public void Update(GameTime gameTime)
        {
            if (sourceRect.X != 1)
            {
                return;
            }
            if (updatetime > 15 && !flipped)
            {
                sourceRect = new Rectangle(
                1 + column * (cardwidth + 2),
                1 + row * (cardheight + 2),
                cardwidth,
                cardheight
                );
            }
            else
            {
                updatetime++;
            }
        }

        public void Draw(SpriteBatch spriteBatch, Texture2D spritesheet, Vector2 position, float scale = 1.0f, Color color = default)
        {
            // Calculates which part of the spritesheet to use

            //moved to update
            

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

        //below methods are for getting the position of the cardSprite on the spriteSheet
        internal int row
        {
            get
            {
                switch (suit)
                {
                    case "Hearts":
                        return 0;
                    case "Clubs":
                        return 1;
                    case "Diamonds":
                        return 2;
                    case "Spades":
                        return 3;
                    case "Special":
                        return 4;
                    default :
                        return 0;
                }
            }
        }

        internal int column
        {
            get
            {
                switch (rank)
                {
                    case "Jack":
                        return 10;
                    case "King":
                        return 12;
                    case "Queen":
                        return 11;
                    case "Ace":
                        return 13;
                    case "Lucky":
                        return 0;
                    case "Dice":
                        return 1;
                    case "Chips":
                        return 2;
                    case "Potion":
                        return 3;
                    case "Camera":
                        return 4;
                    case "Spinner":
                        return 5;
                    case "Martini":
                        return 6;
                    case "House":
                        return 7;
                    case "Housebroken":
                        return 8;
                    default:
                        return value - 1;
                }
            }
        }



    }
}
