using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test
{
    internal class ResolutionManager
    {
        //This class handles scaling the window and fullscreen. It also helps with the 2 low-res and hi-res layers.

        private GraphicsDeviceManager _graphics;
        internal RenderTarget2D lowResTarget { get; private set; }
        internal RenderTarget2D hiResTarget { get; private set; }
        internal Rectangle renderDestination;

        private int nativeWidth;
        private int nativeHeight;
        private int hiResWidth;
        private int hiResHeight;
        private bool isResizing;

        internal ResolutionManager(GraphicsDeviceManager graphics, int width, int height)
        {
            _graphics = graphics;
            nativeWidth = width;
            nativeHeight = height;

            hiResWidth = width * 3;
            hiResHeight = height * 3;
        }

        internal void Initialize(GraphicsDevice graphicsDevice)
        {
            lowResTarget = new RenderTarget2D(graphicsDevice, nativeWidth, nativeHeight);
            hiResTarget = new RenderTarget2D(graphicsDevice, hiResWidth, hiResHeight);
            CalculateDestination(graphicsDevice);
        }

        internal void CalculateDestination(GraphicsDevice graphicsDevice)
        {
            if (isResizing) { return; }
            isResizing = true;

            Point size = graphicsDevice.Viewport.Bounds.Size;

            float scaleX = (float)size.X / nativeWidth;
            float scaleY = (float)size.Y / nativeHeight;
            float scale = Math.Min(scaleX, scaleY);

            renderDestination.Width = (int)(nativeWidth * scale);
            renderDestination.Height = (int)(nativeHeight * scale);

            renderDestination.X = (size.X - renderDestination.Width) / 2;
            renderDestination.Y = (size.Y - renderDestination.Height) / 2;

            isResizing = false;
        }

        internal void ToggleFullscreen(GraphicsDevice device)
        {
            _graphics.IsFullScreen = !_graphics.IsFullScreen;

            // sets the resolution to the monitor's resolution
            if (_graphics.IsFullScreen)
            {
                _graphics.PreferredBackBufferWidth = GraphicsAdapter.DefaultAdapter.CurrentDisplayMode.Width;
                _graphics.PreferredBackBufferHeight = GraphicsAdapter.DefaultAdapter.CurrentDisplayMode.Height;
            }
            else
            {
                // returns to native size
                _graphics.PreferredBackBufferWidth = hiResWidth;
                _graphics.PreferredBackBufferHeight = hiResHeight;
            }

            _graphics.ApplyChanges();

            //adjusts destination to new size
            CalculateDestination(device);
        }

        internal Vector2 translateMousePosition(Vector2 screenCoordinates)
        {
            float X = screenCoordinates.X - renderDestination.X;
            float Y = screenCoordinates.Y - renderDestination.Y;
            float virtualX = X * ((float)hiResTarget.Width/renderDestination.Width);
            float virtualY = Y * ((float)hiResTarget.Height / renderDestination.Height);
            return new Vector2(virtualX, virtualY);
        }
    }
}
