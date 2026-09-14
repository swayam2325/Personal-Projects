using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using System;
using System.Collections.Generic;
//using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test
{
    internal static class Utility
    {
        internal static Random random = new Random();
        internal static string filepath = "..//..//..//text.txt";
        internal static string[] text = File.ReadAllLines(Utility.filepath);


        //Draws a string to fit inside of a rectangle
        internal static void drawFittedText(SpriteBatch _spriteBatch, SpriteFont font, string text, Rectangle rect, Color color)
        {
            Vector2 size = font.MeasureString(text);

            float scaleX = rect.Width / size.X;
            float scaleY = rect.Height / (size.Y);
            float finalScale = Math.Min(scaleX, scaleY);

            _spriteBatch.DrawString(font, text,
            new Vector2(rect.X + (rect.Width / 2), rect.Y + (rect.Height / 2)),
            color, 0, size / 2f, finalScale, 0, 0);
        }

        //Draws the wrapped text for textboxes and cutscenes
        internal static void drawWrappedText(SpriteBatch _spriteBatch, SpriteFont font, string text, Rectangle rect, Color color, float scale)
        {
            string[] words = text.Split(' ');
            string currentline = "";

            float lineSpacing = font.LineSpacing * scale;
            Vector2 currentPos = new Vector2(rect.X, rect.Y);

            foreach (string word in words)
            {
                string testLine = currentline + word + " ";
                if (font.MeasureString(testLine).X * scale > rect.Width)
                {
                    _spriteBatch.DrawString(font, currentline, currentPos, color, 0f, Vector2.Zero, scale, SpriteEffects.None, 0f);
                    currentline = word + " ";
                    currentPos.Y += lineSpacing;

                    if (currentPos.Y + lineSpacing > rect.Y + rect.Height) { return; }
                }
                else
                {
                    currentline = testLine;
                }
            }

            if (!string.IsNullOrEmpty(currentline))
            {
                _spriteBatch.DrawString(font, currentline, currentPos, color, 0f, Vector2.Zero, scale, SpriteEffects.None, 0f);
            }
            
        }

        internal static void testWrite()
        {
            StreamWriter writer = new StreamWriter(filepath);
            writer.WriteLine("hello");
            writer.Close();
        }

        //gets dialogue from the text file
        internal static List<string> getText(string reference)
        {
            List<String> list = new List<string>();
            int index = Array.IndexOf(text, reference);
            if (index <= -1) return list;
            for (int i = index + 1; i < text.Length; i++)
            {
                if (string.IsNullOrWhiteSpace(text[i])) { return list; }
                list.Add(text[i]);
                
            }
            return list;
        }
    }
}
