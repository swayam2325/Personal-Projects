using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test._CutsceneClasses
{
    internal class CutsceneManager
    {
        List<List<Texture2D>> cutsceneList;
        private TextBox _textBox;

        private int _currentCutscene;
        private int currentFrame;
        internal bool isActive { get; private set; }

        KeyboardState previousState;

        internal CutsceneManager(List<List<Texture2D>> cutsceneList, Texture2D pixel)
        {
            this.cutsceneList = cutsceneList;
            _textBox = new TextBox(pixel);
            isActive = false;
        }

        //starts playing the cutscene
        internal void PlayCutscene(int num, string reference)
        {
            if (num < 0 || num >= cutsceneList.Count) { return; }

            _currentCutscene = num;
            currentFrame = 0;
            isActive = true;

            List<String> lines = Utility.getText(reference);
            _textBox.startText(lines);
        }

        internal void Update(GameTime gameTime)
        {
            KeyboardState newState = Keyboard.GetState();

            if (!isActive) { return; }

            if (newState.IsKeyDown(Keys.Space) && previousState.IsKeyUp(Keys.Space))
            {
                if (_textBox.done)
                {
                    int totalFrames = cutsceneList[_currentCutscene].Count;

                    if (currentFrame < totalFrames - 1)
                    {
                        currentFrame++;
                    }
                    else
                    {
                        isActive = false;
                    }
                }
            }

            _textBox.Update(gameTime);

            if (!_textBox.active)
            {
                isActive = false;
            }

            previousState = newState;
        }

        internal void Draw(SpriteBatch _spritebatch, SpriteFont font)
        {
            if (!isActive) { return; }
            List<Texture2D> currentFrames = cutsceneList[_currentCutscene];

            //if (currentFrames[currentFrame] >= )
            _spritebatch.Draw(currentFrames[currentFrame], new Rectangle(5, 10, 800, 550), Color.White);

            _textBox.Draw(_spritebatch, font, new Rectangle(0, 570, 810, 240), Color.White);
            
        }

    }
}
