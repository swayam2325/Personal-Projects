using Microsoft.Xna.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test._ExplorationClasses
{
    internal class NPC
    {
        internal string reference;
        internal Rectangle rect;

        internal NPC(string reference, Rectangle rect)
        {
            this.reference = reference;
            this.rect = rect;
        }

        internal void Scroll(int xChange)
        {
            rect.X += xChange;
        }
    }
}
