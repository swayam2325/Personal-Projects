using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
//using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace project_test._BattleClasses
{
    internal enum HandState
    {
        Rest, Hit, Stand
    }
    internal class AnimatedHand
    {
        internal Texture2D spriteSheet;
        private Vector2 currentPos;
        private Vector2 targetPos;
        private Vector2 restPos;
        private Vector2 shakeOffset;

        private HandState state = HandState.Rest;
        private float timer = 0f;
        private int column = 0;
        private Color color;
        private bool isEnemy;

        float speed = 0.5f;

        private int width = 418;

        internal AnimatedHand(Texture2D sprites, Vector2 startingPos, Color color, bool isEnemy)
        {
            spriteSheet = sprites;
            restPos = startingPos;
            currentPos = startingPos;
            targetPos = startingPos;
            this.color = color;
            this.isEnemy = isEnemy;
            if (isEnemy)
            {
                speed = 0.3f;
            }
        }

        internal void goTo(HandState state, Vector2 target)
        {
            this.state = state;
            targetPos = target;
            timer = 0f;
        }

        internal void Update(GameTime gameTime)
        {
            float time = (float)gameTime.ElapsedGameTime.TotalSeconds;
            timer += time;

            currentPos = Vector2.Lerp(currentPos, targetPos, 0.3f);

            switch (state)
            {
                case HandState.Rest:
                    column = 0;
                    shakeOffset = Vector2.Zero;
                    targetPos = restPos;
                    break;
                case HandState.Hit:
                    column = 2;
                    if (timer > speed) goTo(HandState.Rest, restPos);
                    break;
                case HandState.Stand:
                    column = 1;
                    shakeOffset.X = (float)Math.Sin(timer * 15f) * 10f;
                    if (timer > speed)
                    {
                        shakeOffset = Vector2.Zero;
                        goTo(HandState.Rest, restPos);
                    }
                    break;
            }
        }

        internal void Draw(SpriteBatch _spriteBatch)
        {
            Rectangle sourceRect = new Rectangle(column * width, 0, width, 600);
            if (isEnemy)
            {
                _spriteBatch.Draw(spriteSheet, currentPos + shakeOffset, sourceRect, color, 0f, Vector2.Zero, 1f, SpriteEffects.FlipHorizontally, 0f);
            }
            else
            {
                _spriteBatch.Draw(spriteSheet, currentPos + shakeOffset, sourceRect, color);
            }
            
        }
    }
}
