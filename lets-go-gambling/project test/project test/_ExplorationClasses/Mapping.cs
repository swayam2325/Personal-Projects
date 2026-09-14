using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;

namespace project_test._ExplorationClasses
{
    enum CurrentMap
    {
        Lobby
    }
    internal static class Mapping
    {
        internal static List<Rectangle> boundaries;
        internal static Rectangle goal;
        internal static List<NPC> npcs = new List<NPC>();
        // Adds non-walkable areas based on what map is being loaded
        internal static void AddBoundaries(int num)
        {
            boundaries = new List<Rectangle>();
            switch (num)
            {
                case 1:
                    boundaries.Add(new Rectangle(0,0,91,126));      //Left part of the line
                    boundaries.Add(new Rectangle(92, 0, 174, 62));  // Upper part of the line
                    boundaries.Add(new Rectangle(275, 0, 80, 134)); // Desk
                    boundaries.Add(new Rectangle(0, 209, 15, 62));  // Bottom left corner
                    boundaries.Add(new Rectangle(150, 223, 68, 1)); // Guys on the floor
                    boundaries.Add(new Rectangle(195, 195, 10, 28));// Pink guy on the floor
                    boundaries.Add(new Rectangle(337, 242, 19, 29));// Bottom right corner
                    goal = new Rectangle(340, 200, 100, 100);
                    npcs.Add(new NPC("//CLERK", new Rectangle(268, 0, 80, 141)));
                    npcs.Add(new NPC("//NPC 1", new Rectangle(190, 190, 20, 33)));
                    npcs.Add(new NPC("//FLOOR", new Rectangle(145, 218, 110, 25)));
                    npcs.Add(new NPC("//LINE 1", new Rectangle(0, 0, 70, 137)));
                    npcs.Add(new NPC("//LINE 2", new Rectangle(70, 0, 25, 137)));
                    npcs.Add(new NPC("//LINE 3", new Rectangle(92, 0, 87, 72)));
                    npcs.Add(new NPC("//LINE 4", new Rectangle(179, 0, 87, 72)));
                    break;
                default:
                    npcs.Add(new NPC($"//NPC {num}", new Rectangle()));
                    goal = new Rectangle(340,200,100,100);
                    break;
            }
        }

        internal static string GetInteraction(Rectangle playerRect)
        {
            foreach (NPC npc in npcs)
            {
                if (playerRect.Intersects(npc.rect))
                {
                    return npc.reference;
                }
            }
            return null;
        }
        // Makes sure we can't run into anything
        internal static void CheckBoundaries(Inspector inspec)
        {
            foreach(Rectangle rect in boundaries)
            {
                if (inspec.inspecboundary.Intersects(rect))
                {
                    if (inspec.inspecboundary.X < (rect.X + rect.Width) && (inspec.state == InspecState.WalkLeft || inspec.state == InspecState.Left))
                    {
                        inspec.location.X = rect.Width + rect.X;
                        inspec.inspecboundary.X = rect.Width + rect.X;
                    }
                    else if(inspec.inspecboundary.Y < (rect.Y + rect.Height) && (inspec.state == InspecState.WalkUp || inspec.state == InspecState.Up))
                    {
                        inspec.location.Y = rect.Height + rect.Y;
                        inspec.inspecboundary.Y = rect.Height + rect.Y;
                    }
                    else if((inspec.inspecboundary.X + inspec.inspecboundary.Width) > rect.X && (inspec.state == InspecState.WalkRight || inspec.state == InspecState.Right))
                    {
                        inspec.location.X = rect.X - inspec.inspecboundary.Width;
                        inspec.inspecboundary.X = rect.X - inspec.inspecboundary.Width;
                    }
                    else if ((inspec.inspecboundary.Y + inspec.inspecboundary.Height) > rect.Y && (inspec.state == InspecState.WalkDown || inspec.state == InspecState.Down))
                    {
                        inspec.location.Y = rect.Y - inspec.inspecboundary.Height;
                        inspec.inspecboundary.Y = rect.Y - inspec.inspecboundary.Height;
                    }
                }
            }
        }
        // Moves the boundaries with the background
        internal static void DontMove(bool AreWeGoingRight)
        {
            if (AreWeGoingRight == true)
            {
                for (int i = 0; i < boundaries.Count; i++)
                {
                    Rectangle r = boundaries[i];
                    r.X -= 1;
                    boundaries[i] = r;
                }
                foreach (NPC n in npcs) { n.rect.X -= 1; }
                goal.X -= 1;
            }
            else
            {
                for (int i = 0; i < boundaries.Count; i++)
                {
                    Rectangle r = boundaries[i];
                    r.X += 1;
                    boundaries[i] = r;
                }
                foreach (NPC n in npcs) { n.rect.X += 1; }
                goal.X += 1;
            }
        }
    }
}
