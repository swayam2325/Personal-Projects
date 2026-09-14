using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace project_test
{
    internal class Deck
    {

        //PROBLEM: CARDS WILL BE ADDED TO THE DISCARD PILE BEFORE THEY ARE USED
        //Potential fix: make a "to be discarded" list?
        internal string name;
        //The deck is a list, not an array, because some decks will have non-standard sizes
        private List<Card> cards = new List<Card>();
        private List<Card> toDiscard = new List<Card>();
        private List<Card> discard = new List<Card>();
        Random random = Utility.random;
        internal Deck(string name)
        {
            this.name = name;
        }

        //Draws card, if the stack is empty, resets the discard pile
        internal Card drawCard()
        {
            if (cards.Count > 0)
            {
                Card card = cards[0];
                toDiscard.Add(card);
                cards.RemoveAt(0);
                return card;
            }

            //No cards left = discard and shuffle
            if (discard.Count > 0)
            {
                resetDiscard();
                shuffle();
                return drawCard();
            }

            Console.WriteLine("You fucked somethin up");
            return new Card("Null", "0");
        }
        
        internal void Reset()
        {
            resetDiscard();
            shuffle();
        }

        //shuffles the cards
        private void shuffle()
        {
            for (int i = cards.Count - 1; i > 0; i--)
            {
                int randomCard = random.Next(0, i + 1);

                Card temp = cards[i];
                cards[i] = cards[randomCard];
                cards[randomCard] = temp;
            }

        }

        //puts the cards into the discard pile
        internal void endRound()
        {
            foreach (Card c in toDiscard)
            {
                discard.Add(c);
            }
            toDiscard.Clear();
        }

        //brings the discard pile back into the main deck
        private void resetDiscard()
        {
            if (discard.Count > 0)
            {
                foreach (Card c in discard)
                {
                    cards.Add(c);
                }
                discard.Clear();
            }
            else
            {
                Console.WriteLine("Problem with Discard Pile!");
            }
        }

       //old card method for testing
        internal void display()
        {
            foreach (Card c in cards)
            {
                Console.WriteLine($"{c.rank} of {c.suit}");
            }
        }

        // FROM HERE DOWN THESE ARE DECK PRESETS (sets deck to standard or modded decks)
        internal void standardDeck()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            List<string> suits = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
            List<string> values = new List<string> { "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace" };

            foreach (string suit in suits)
            {
                foreach (string value in values)
                {
                    cards.Add(new Card(suit, value));
                }
            }
            shuffle();
            Console.WriteLine(cards.Count);
        }

        internal void randomDeck()
        {
            string newName = "";
            switch (Utility.random.Next(1, 5))
            {
                case 1:
                    newName = "Standard Deck";
                    break;
                case 2:
                    newName = "Multiples of 5";
                    break;
                case 3:
                    newName = "All Even";
                    break;
                case 4:
                    newName = "All Odd";
                    break;
            }
            while (newName == name)
            {
                switch (Utility.random.Next(1, 5))
                {
                    case 1:
                        newName = "Standard Deck";
                        break;
                    case 2:
                        newName = "Multiples of 5";
                        break;
                    case 3:
                        newName = "All Even";
                        break;
                    case 4:
                        newName = "All Odd";
                        break;
                }
            }
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            name = newName;
            switch (name)
            {
                case "Standard Deck":
                    List<string> suits = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
                    List<string> values = new List<string> { "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace" };

                    foreach (string suit in suits)
                    {
                        foreach (string value in values)
                        {
                            cards.Add(new Card(suit, value));
                        }
                    }
                    shuffle();
                    break;
                case "Multiples of 5":
                    List<string> suits2 = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
                    List<string> values2 = new List<string> { "5", "10" };
                    foreach (string suit in suits2)
                    {
                        foreach (string value in values2)
                        {
                            cards.Add(new Card(suit, value));
                            cards.Add(new Card(suit, value));
                            cards.Add(new Card(suit, value));
                        }
                    }

                    for (int i = 0; i < 6; i++)
                    {
                        cards.Add(new Card("Special", "Chips"));
                    }
                    shuffle();
                    break;
                case "All Even":
                    List<string> suits3 = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
                    List<string> values3 = new List<string> { "2", "4", "6", "8", "10", "Jack", "Queen", "King" };

                    foreach (string suit in suits3)
                    {
                        foreach (string value in values3)
                        {
                            cards.Add(new Card(suit, value));
                        }
                    }
                    shuffle();
                    break;
                case "All Odd":
                    List<string> suits4 = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
                    List<string> values4 = new List<string> { "3", "5", "7", "9", "Ace" };

                    foreach (string suit in suits4)
                    {
                        foreach (string value in values4)
                        {
                            cards.Add(new Card(suit, value));
                            cards.Add(new Card(suit, value));
                        }
                    }
                    shuffle();
                    break;
            }


        }


        internal void sevenDeck()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            List<string> suits = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
            List<string> values = new List<string> { "2", "3", "4", "5", "9", "10", "Jack", "Queen", "King", "Ace" };
            
            foreach (string suit in suits)
            {
                foreach (string value in values)
                {
                    cards.Add(new Card(suit, value));
                }
            }
            
            for (int i = 0; i < 20;  i++)
            {
                cards.Add(new Card("Special", "Lucky"));
            }
            shuffle();
            Console.WriteLine(cards.Count);
        }

        internal void diceDeck()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            List<string> suits = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
            List<string> values = new List<string> { "2", "3", "4", "5", "6" };
            foreach (string suit in suits)
            {
                foreach (string value in values)
                {
                    cards.Add(new Card(suit, value));
                }
            }

            for (int i = 0;i < 4;i++)
            {
                cards.Add(new Card("Special", "Dice"));
            }
            shuffle();
        }

        internal void chipDeck()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            List<string> suits = new List<string> { "Hearts", "Clubs", "Diamonds", "Spades" };
            List<string> values = new List<string> { "5", "10" };
            foreach (string suit in suits)
            {
                foreach (string value in values)
                {
                    cards.Add(new Card(suit, value));
                    cards.Add(new Card(suit, value));
                    cards.Add(new Card(suit, value));
                }
            }

            for (int i = 0; i < 6;i++)
            {
                cards.Add(new Card("Special", "Chips"));
            }

            for (int i = 0; i < 10; i++)
            {
                cards.Add(new Card("Special", "Potion"));
            }
            shuffle();
        }

        internal void cameraDeck()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            List<string> suits = new List<string> { "Clubs", "Diamonds", "Spades" };
            List<string> values = new List<string> { "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King" };

            foreach (string suit in suits)
            {
                foreach (string value in values)
                {
                    cards.Add(new Card(suit, value));
                }
            }
            for (int i = 0; i < 13; i++)
            {
                cards.Add(new Card("Special", "Camera"));
            }
            shuffle();
        }

        internal void houseDeck()
        {
            for (int i = 0; i < 52; i++)
            {
                cards.Add(new Card("Special", "House"));
            }
        }

        internal void housebrokenDeck()
        {
            for (int i = 0; i < 52; i++)
            {
                cards.Add(new Card("Special", "Housebroken"));
            }
        }

        internal void oopsAllFives()
        {
            cards.Clear();
            discard.Clear();
            toDiscard.Clear();
            for (int i = 0; i < 13 ; i++)
            {
                cards.Add(new Card("Hearts", "5"));
                cards.Add(new Card("Hearts", "10"));
                cards.Add(new Card("Hearts", "15"));
                cards.Add(new Card("Hearts", "5"));
            }
            shuffle();
        }
        
    }
}
