using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test._CutsceneClasses
{
    internal class TextBox
    {
        private List<string> dialogueLines;
        private int currentLine = 0;

        private float charactersVisible = 0;
        private float textSpeed = 25f;
        internal bool done = false;
        private Texture2D pixel;

        internal bool active = false;

        private KeyboardState oldState;

        internal TextBox(Texture2D pixel)
        {
            this.pixel = pixel;
        }

        //starts the text. keeps going until it is done.
        internal void startText(List<string> lines)
        {
            dialogueLines = lines;
            active = true;
            currentLine = 0;
            charactersVisible = 0;
            done = false;
        }

        internal void Update(GameTime gameTime)
        {
            if (!active) { return; }
            if (!active || currentLine >= dialogueLines.Count) { active = false; return; }

            KeyboardState newState = Keyboard.GetState();

            if (currentLine < dialogueLines.Count)
            {
                if (charactersVisible < dialogueLines[currentLine].Length)
                {
                    charactersVisible += (float)gameTime.ElapsedGameTime.TotalSeconds * textSpeed;
                }
                else
                {
                    done = true;
                }
            }

            if (newState.IsKeyDown(Keys.Space) && oldState.IsKeyUp(Keys.Space))
            {
                if (done)
                {
                    currentLine++;
                    charactersVisible = 0;
                    done = false;
                }
                else
                {
                    charactersVisible = dialogueLines[currentLine].Length;
                    done = true;
                }
            }

            oldState = newState;
        }

        internal void Draw(SpriteBatch _spriteBatch, SpriteFont font, Rectangle location, Color color)
        {
            if (!active || currentLine >= dialogueLines.Count) { return; }

            string currentText = dialogueLines[currentLine];
            int count = (int)charactersVisible > currentText.Length ? currentText.Length : (int)charactersVisible;
            string visibleText = currentText.Substring(0, count);

            _spriteBatch.Draw(pixel, location, Color.White);
            _spriteBatch.Draw(pixel, new Rectangle(location.X + 3, location.Y + 3, location.Width - 6, location.Height - 6), Color.Black);

            Utility.drawWrappedText(_spriteBatch, font, visibleText, new Rectangle(location.X + 20, location.Y + 20, location.Width - 40, location.Height - 40), color, 3f);

        }
    }
}
