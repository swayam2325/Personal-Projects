using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test._UtilityClasses
{
    internal class Fade
    {

        //Class for fading to black and facing back in

        private double fadePercent;
        internal bool fadeIn;
        private bool fadeOut;
        Texture2D texture;

        internal Fade(Texture2D texture)
        {
            this.texture = texture;
        }

        internal void Update(GameTime gameTime)
        {
            if (fadeIn)
            {
                if (fadePercent < 1) { fadePercent += 0.1; }
                else { fadeIn = false; fadeOut = true; }
            }
            else if (fadeOut)
            {
                if (fadePercent > 0) { fadePercent -= 0.1; }
                else { fadeOut = false; }
            }
        }

        internal void Draw(SpriteBatch _spriteBatch)
        {
            _spriteBatch.Draw(texture, new Rectangle(0, 0, 810, 810), Color.Black * (float)fadePercent);
        }

        internal void FadeIn()
        {
            fadeIn = true;
            fadeOut = false;
        }
        internal void FadeOut()
        {
            fadeIn = false;
            fadeOut = true;
        }
    }
}
