using System;
using System.Reflection.Metadata.Ecma335;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;

namespace project_test._UtilityClasses
{
    /// <summary>
    /// If the client wants to be notified when a button is clicked, it must
    /// implement a method matching this delegate and then tie that method to
    /// the button's "OnButtonClick" event.
    /// </summary>
    /// <param name="clickedButton">The delegate will be called with a reference to the clicked button</param>
    public delegate void OnButtonClickDelegate();

    /// <summary>
    /// The Button class adds button specific information and behavior to the
    /// generic GameObject class - including checking for mouse clicks.
    /// </summary>
    public class Button
    {
        // Button specific fields
        protected SpriteFont font;
        protected MouseState prevMState;
        protected bool enabled = true;
        private bool mouseOver;
        private string text;
        protected Rectangle position; // Button position and size
        private Vector2 textLoc;
        Texture2D buttonImg;
        private Color textColor;

        /// <summary>
        /// If the client wants to be notified when a button is clicked, it must
        /// implement a method matching OnButtonClickDelegate and then tie that method to
        /// the button's "OnButtonClick" event.
        /// 
        /// The delegate will be called with a reference to the clicked button.
        /// </summary>
        public event OnButtonClickDelegate OnButtonLeftClick;
        public event OnButtonClickDelegate OnButtonRightClick;

        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        // TODO: Add your new event here!
        // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        /// <summary>
        /// Create a new custom button
        /// </summary>
        /// <param name="position">Where to draw the button's top left corner</param>
        /// <param name="text">The text to draw on the button</param>
        /// <param name="font">The font to use when drawing the button text.</param>
        /// <param name="color">The color to tint the button when it is active. Buttons are always grayed out when disabled.</param>
        public Button(GraphicsDevice device, Rectangle position, string text, SpriteFont font, Color color)
        {
            // Save copies/references to the info we'll need later
            this.font = font;
            this.position = position;
            this.text = text;

            // Figure out where on the button to draw it
            Vector2 textSize = font.MeasureString(text);
            //Vector2 textSize = font.MeasureString(text);
            textLoc = new Vector2(
                position.X + position.Width / 2 - textSize.X / 2,
                position.Y + position.Height / 2 - textSize.Y / 2
            );

            // Invert the button color for the text color (because why not)
            textColor = new Color(255 - color.R, 255 - color.G, 255 - color.B);

            // Make a custom 2d texture for the button itself
            buttonImg = new Texture2D(device, position.Width, position.Height, false, SurfaceFormat.Color);
            int[] colorData = new int[buttonImg.Width * buttonImg.Height];
            Array.Fill(colorData, (int)color.PackedValue);
            buttonImg.SetData(colorData, 0, colorData.Length);
        }
        public void Update(GameTime gameTime)
        {
            // Check/capture the mouse state regardless of whether this button
            // if active so that it's up to date next time!
            MouseState mState = Mouse.GetState();
            if (mState.LeftButton == ButtonState.Released &&
                prevMState.LeftButton == ButtonState.Pressed &&
                position.Contains(mState.Position))
            {

                if (OnButtonLeftClick != null)
                {
                    OnButtonLeftClick();
                }
            }
            if (position.Contains(mState.Position)) { mouseOver = true; }
            else
            {
                mouseOver = false;
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // TODO: Add your new click detection here!
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            if (mState.RightButton == ButtonState.Released &&
                prevMState.RightButton == ButtonState.Pressed &&
                position.Contains(mState.Position))
            {
                if (OnButtonRightClick != null)
                {
                    OnButtonRightClick();
                }
            }
            prevMState = mState;
        }

        /// <summary>
        /// Each frame, update its status if it's been clicked.
        /// </summary>
        /// <param name="gameTime">Unused, but required to implement abstract class</param>
        /// 
        public void Update(GameTime gameTime, Vector2 translatedMousePosition)
        {
            // Check/capture the mouse state regardless of whether this button
            // if active so that it's up to date next time!
            MouseState mState = Mouse.GetState();
            if (mState.LeftButton == ButtonState.Released &&
                prevMState.LeftButton == ButtonState.Pressed &&
                position.Contains(translatedMousePosition))
            {
                
                if (OnButtonLeftClick != null)
                {
                    OnButtonLeftClick();
                }
            }
            if (position.Contains(translatedMousePosition)) { mouseOver = true; }
            else
            {
                mouseOver = false;
            }

            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            // TODO: Add your new click detection here!
            // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
            if (mState.RightButton == ButtonState.Released &&
                prevMState.RightButton == ButtonState.Pressed &&
                position.Contains(translatedMousePosition))
            {
                if (OnButtonRightClick != null)
                {
                    OnButtonRightClick();
                }
            }
            prevMState = mState;
        }

        /// <summary>
        /// Override the GameObject Draw() to draw the button and then
        /// overlay it with text.
        /// </summary>
        /// <param name="spriteBatch">The spriteBatch on which to draw this button. The button 
        /// assumes that Begin() has already been called and End() will be called later.</param>
        public void Draw(SpriteBatch spriteBatch)
        {
            // Draw the button itself
            
            spriteBatch.Draw(buttonImg, position, Color.White);
            if (mouseOver) { spriteBatch.Draw(buttonImg, position, Color.Black * 0.2f); }
            //if (mouseOver) { Utility.drawFittedText(spriteBatch, font, text, new Rectangle(position.X, position.Y, (int)((float)position.Width * 0.8f), (int)((float)position.Height * 0.8f)), textColor); }
            if (mouseOver) { spriteBatch.DrawString(font, ">" + text, textLoc, textColor); }
            else { spriteBatch.DrawString(font, text, textLoc, textColor); }
                // Draw button text over the button
                
        }

    }
}
