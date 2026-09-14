using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using Vector2 = Microsoft.Xna.Framework.Vector2;

namespace project_test._ExplorationClasses
{
    // The inspector's current sprite state
    enum InspecState
    {
        Up,
        WalkUp,
        Down,
        WalkDown,
        Left,
        WalkLeft,
        Right,
        WalkRight
    }
    internal class Inspector
    {
        internal InspecState state;
        private Texture2D spritesheet;
        internal Vector2 location;
        private Keys pressedkey;
        internal Rectangle inspecboundary;

        // I borrowed a lot of this from the mario walking PE
        private int frame;
        private double timeCounter;
        private double fps;
        private double timePerFrame;
        private const int WalkFrameCount = 4;
        private const int InspecWidth = 24;

        // Makes the inspector
        internal Inspector(Texture2D spritesheet, Vector2 location, InspecState firststate)
        {
            this.spritesheet = spritesheet;
            this.location = location;
            state = firststate;
            fps = 8.0;
            timePerFrame = 1.0 / fps;
            inspecboundary = new Rectangle((int)location.X, (int)location.Y, 24, 23);
        }
        // He walkin
        internal void UpdateAnimation(GameTime gameTime)
        {
            timeCounter += gameTime.ElapsedGameTime.TotalSeconds;
            if (timeCounter >= timePerFrame)
            {
                frame += 1;

                if (frame > WalkFrameCount)
                    frame = 1;

                timeCounter -= timePerFrame;
            }
        }
        // Lets the inspector move while keeping him inside the walls of the room he's in
        internal void StayInTheBox(Rectangle border, int XChange, int YChange)
        {
            location.X += XChange;
            inspecboundary.X += XChange;
            location.Y += YChange;
            inspecboundary.Y += YChange;
            if (location.X < border.X)
            {
                location.X = border.X;
                inspecboundary.X = border.X;
            }
            else if (location.Y < border.Y)
            {
                location.Y = border.Y;
                inspecboundary.Y = border.Y;
            }
            else if (location.X > border.Width)
            {
                location.X = border.Width;
                inspecboundary.X = border.Width;
            }
            else if (location.Y > border.Height)
            {
                location.Y = border.Height;
                inspecboundary.Y = border.Height;
            }
        }
        // Changes the inspectors state based the keys being pressed
        internal void InspecMover(GameTime gameTime, Rectangle boarder, Rectangle bkg)
        {
            UpdateAnimation(gameTime);
            if (Keyboard.GetState().IsKeyDown(Keys.Up))
            {
                pressedkey = Keys.Up;
            }
            else if (Keyboard.GetState().IsKeyDown(Keys.Down))
            {
                pressedkey = Keys.Down;
            }
            else if (Keyboard.GetState().IsKeyDown(Keys.Left))
            {
                pressedkey = Keys.Left;
            }
            else if (Keyboard.GetState().IsKeyDown(Keys.Right))
            {
                pressedkey = Keys.Right;
            }
            switch (pressedkey)
            {
                case Keys.Up:
                    state = InspecState.Up;
                    break;
                case Keys.Down:
                    state = InspecState.Down;
                    break;
                case Keys.Left:
                    state = InspecState.Left;
                    break;
                case Keys.Right:
                    state = InspecState.Right;
                    break;
            }
            if (state == InspecState.Up && Keyboard.GetState().IsKeyDown(Keys.Up))
            {
                state = InspecState.WalkUp;
                StayInTheBox(boarder, 0, -1);
            }
            else if (state == InspecState.Down && Keyboard.GetState().IsKeyDown(Keys.Down))
            {
                state = InspecState.WalkDown;
                StayInTheBox(boarder, 0, 1);
            }
            else if (state == InspecState.Left && Keyboard.GetState().IsKeyDown(Keys.Left))
            {
                state = InspecState.WalkLeft;
                if (location.X < 70 && bkg.X < 0)
                {
                    StayInTheBox(boarder, 0, 0);
                }
                else
                {
                    StayInTheBox(boarder, -1, 0);
                }
            }
            else if (state == InspecState.Right && Keyboard.GetState().IsKeyDown(Keys.Right))
            {
                state = InspecState.WalkRight;
                if (location.X > 170 && bkg.X > -82)
                {
                    StayInTheBox(boarder, 0, 0);
                }
                else
                {
                    StayInTheBox(boarder, 1, 0);
                }
            }
        }
        // Draws the inspector
        internal void Draw(SpriteBatch spriteBatch)
        {
            switch (state)
            {
                case InspecState.Up:
                    DrawUp (SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.WalkUp:
                    DrawWalkUp(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.Down:
                    DrawDown(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.WalkDown:
                    DrawWalkDown(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.Left:
                    DrawLeft(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.WalkLeft:
                    DrawWalkLeft(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.Right:
                    DrawRight(SpriteEffects.None, spriteBatch);
                    break;
                case InspecState.WalkRight:
                    DrawWalkRight(SpriteEffects.None, spriteBatch);
                    break;
            }
        }
        // All of these just dictate where in the spritesheet certain sprite are
        // Note to self: Up is facing *away* from the screen, down is facing *toward* it
        private void DrawUp(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * 8, 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawWalkUp(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * (7 + frame), 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawDown(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(0, 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawWalkDown(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * (-1 + frame), 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawLeft(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * 12, 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawWalkLeft(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * (11 + frame), 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawRight(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * 4, 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
        private void DrawWalkRight(SpriteEffects flipSprite, SpriteBatch spriteBatch)
        {
            spriteBatch.Draw(spritesheet, location, new Rectangle(InspecWidth * (3 + frame), 0, 24, 23), Color.White, 0, Vector2.Zero, 1.0f, flipSprite, 0);
        }
    }
}
