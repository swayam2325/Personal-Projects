using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Diagnostics.CodeAnalysis;
using System.Numerics;
using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using project_test._BattleClasses;
using project_test._CutsceneClasses;
using project_test._ExplorationClasses;
using project_test._UtilityClasses;
using static System.Formats.Asn1.AsnWriter;
using Vector2 = Microsoft.Xna.Framework.Vector2;

namespace project_test._GeneralClasses
{
    /* NOTES ***********
         * 
         * Because we don't have the finished assets, exploration only happens on floor 1.
         * If we had time to create the other floor assets, they would have been implemented the same way, just slightly different boundaries/collision.
         * 
         * FUTURE TODO:
         *  - Healthbar decrease animation
         *  - proper card flipping animation
         *  
         *  Note: Font under creative commons license. Credit to ocheung on fontstruct
    */
    internal enum DevState
    {
        Battle,
        Menu,
        Exploration,
        Cutscene
    }
    public class Game1 : Game
    {
        private GraphicsDeviceManager _graphics;
        private SpriteBatch _spriteBatch;
        private Texture2D texture;

        //Change state of game;
        DevState DevState = DevState.Menu;

        private ResolutionManager scaler;
        private BattleRenderer battleRenderer;
        
        //game specific
        private BattleManager battle;
        private Player player;
        private Player enemy;
        int bustValue;
        int standValue;
        //Progress Tracking
        int BattleNum = 1;
        int step = 0;

        private int enemyFrameCounter = 0;
        private Fade fade;

        //Sprites, fonts, buttons
        private Texture2D cardSprites;
        private Texture2D pixel;
        private Texture2D bkg;
        private Texture2D bkgexp;
        private Texture2D board;
        private Texture2D boardFront;
        private Texture2D handSprites;
        private Texture2D bleed;
        private SpriteFont font;

        private List<Button> buttons;

        //Mouse and keyboard states
        KeyboardState previous = default;
        private MouseState currentMouse;
        private MouseState previousMouse;

        //For exploration
        Inspector inspector;
        Texture2D ourguy;
        Rectangle border;
        Rectangle bkgmanager;

        //Text and cutscenes
        TextBox textbox;
        CutsceneManager cutsceneManager;



        public Game1()
        {
            _graphics = new GraphicsDeviceManager(this);
            Content.RootDirectory = "Content";
            IsMouseVisible = true;
            //Window.ClientSizeChanged += OnClientSizeChanged;
            buttons = new List<Button>();
        }

        protected override void Initialize()
        {
            // TODO: Add your initialization logic here
            
            //Variables for window changing
            _graphics.HardwareModeSwitch = false;
            _graphics.PreferredBackBufferWidth = 810;
            _graphics.PreferredBackBufferHeight = 810;
            Window.AllowUserResizing = true;
            _graphics.ApplyChanges();
            scaler = new ResolutionManager(_graphics, 270, 270);
            Window.ClientSizeChanged += (s, e) => scaler.CalculateDestination(GraphicsDevice);
            scaler.Initialize(GraphicsDevice);

            Deck pDeck = new Deck("Player Deck");
            pDeck.standardDeck();

            Deck eDeck = new Deck("Enemy Deck");
            eDeck.standardDeck();

            player = new Player("Player", pDeck, 75);
            enemy = new Player("Mr. H", eDeck, 100);

            bustValue = 21;
            standValue = 17;

            battle = new BattleManager(player, enemy, bustValue, standValue);
           
           
            border = new Rectangle(4,4,266,266);

            border = new Rectangle(0,28,246,244);

            base.Initialize();
        }

        protected override void LoadContent()
        {
            BattleNum = 0;
            //Default monogame line:
            _spriteBatch = new SpriteBatch(GraphicsDevice);

            // A pixel texture (Can be used to draw squares)
            pixel = new Texture2D(GraphicsDevice, 1, 1);
            pixel.SetData(new[] { Color.White });

            fade = new Fade(pixel);

            font = Content.Load<SpriteFont>("File");
            texture = Content.Load<Texture2D>("profiles");
            cardSprites = Content.Load<Texture2D>("cardsprites (3)");
            battleRenderer = new BattleRenderer(texture, font, pixel);
            bkg = Content.Load<Texture2D>("title2");
            bkgexp = Content.Load<Texture2D>("Floor");
            board = Content.Load<Texture2D>("tex");
            boardFront = Content.Load<Texture2D>("table");
            handSprites = Content.Load<Texture2D>("hands");
            bleed = Content.Load<Texture2D>("bleed");

            cutsceneManager = new CutsceneManager(LoadCutscenes(Content), pixel);
            //cutsceneManager.PlayCutscene(0, "//CUTSCENE 0");
            textbox = new TextBox(pixel);
            //textbox.startText(Utility.getText("//CUTSCENE 9"));


            //Exploration
            //bkg = Content.Load<Texture2D>("Floor");
            bkgmanager = new Rectangle(0, 0, bkgexp.Width, bkgexp.Height);
            ourguy = Content.Load<Texture2D>("Guy");
            inspector = new Inspector(ourguy, new Vector2(20, 170), InspecState.Right);
            Mapping.AddBoundaries(1);

            
            //Load logic
            switch (DevState)
            {
                case DevState.Battle:
                    font = Content.Load<SpriteFont>("File");
                    texture = Content.Load<Texture2D>("profiles");
                    cardSprites = Content.Load<Texture2D>("cardsprites (3)");
                    bkg = Content.Load<Texture2D>("title");
                    battleRenderer = new BattleRenderer(texture, font, pixel);
                    resetBattle();
                    break;
                case DevState.Menu:
                    setMenu();
                    //LoadContent Code here
                    break;
                case DevState.Exploration:
                    //LoadContent Code here
                    bkg = Content.Load<Texture2D>("Floor");
                    bkgmanager = new Rectangle(0, 0, bkg.Width, bkg.Height);
                    ourguy = Content.Load<Texture2D>("Guy");
                    //inspector = new Inspector(ourguy, new Vector2(100, 100), InspecState.Right);
                    Mapping.AddBoundaries(1);
                    break;
            }
            
        }

        protected override void Update(GameTime gameTime)
        {

            if (GamePad.GetState(PlayerIndex.One).Buttons.Back == ButtonState.Pressed || Keyboard.GetState().IsKeyDown(Keys.Escape))
                Exit();
            textbox.Update(gameTime);
            currentMouse = Mouse.GetState();
            KeyboardState kState = Keyboard.GetState();

            if (kState.IsKeyDown(Keys.Escape)) Exit();
            if (!kState.IsKeyDown(Keys.F11) && previous.IsKeyDown(Keys.F11)) scaler.ToggleFullscreen(GraphicsDevice);
            Vector2 mouseposition = scaler.translateMousePosition(new Vector2(currentMouse.X, currentMouse.Y));
            //foreach (Button b in buttons) { b.Update(gameTime, mouseposition); }
            fade.Update(gameTime);
            switch (DevState)
            {
                case DevState.Battle:
                    if (battle.battleOver() && (player.hp > 0 || enemy.Name == "Mr. H"))
                    {
                        if (enemy.Name == "Mr. H" || enemy.Name == "Mr. House") { fade.FadeIn(); nextPhase(); }
                        //fade.FadeIn();
                        //nextPhase();
                        if (!fade.fadeIn && (kState.IsKeyDown(Keys.Space) && !previous.IsKeyDown(Keys.Space)))
                        {
                            nextPhase();
                            fade.FadeIn();
                            //fade.FadeIn();
                            //nextPhase();
                        }
                    }
                    if (!kState.IsKeyDown(Keys.R) && previous.IsKeyDown(Keys.R)) { resetBattle(); }
                    if (!kState.IsKeyDown(Keys.E) && previous.IsKeyDown(Keys.E)) { increaseBattleNum(); }
                    battle.Update(gameTime, kState, previous, mouseposition, buttons);
                    break;
                case DevState.Menu:
                    foreach (Button b in buttons) { b.Update(gameTime, mouseposition); }
                    break;
                case DevState.Exploration:
                    if (inspector.inspecboundary.Intersects(Mapping.goal)) { nextPhase(); fade.FadeIn(); break; }
                    //if (inspector.inspecboundary.Intersects(Mapping.goal)) { resetBattle(); fade.FadeIn(); break; }
                    inspector.InspecMover(gameTime, border, bkgmanager);
                    Mapping.CheckBoundaries(inspector);
                    if (inspector.location.X > 170 && bkgmanager.X > -82 && inspector.state == InspecState.WalkRight)
                    {
                        bkgmanager.X -= 1;
                        Mapping.DontMove(true);
                    }
                    else if (inspector.location.X < 70 && bkgmanager.X < 0 && inspector.state == InspecState.WalkLeft)
                    {
                        bkgmanager.X += 1;
                        Mapping.DontMove(false);
                    }

                    if (kState.IsKeyDown(Keys.Space) && !previous.IsKeyDown(Keys.Space) && !textbox.active)
                    {
                        string textref = Mapping.GetInteraction(inspector.inspecboundary);
                        if (textref != null)
                        {
                            textbox.startText(Utility.getText(textref));
                        }
                    }
                    break;
                case DevState.Cutscene:
                    //if (kState.IsKeyDown(Keys.Space) && !previous.IsKeyDown(Keys.Space)) { fade.FadeIn(); }
                    cutsceneManager.Update(gameTime);
                    if (!cutsceneManager.isActive && (kState.IsKeyDown(Keys.Space) && !previous.IsKeyDown(Keys.Space)))
                    {
                        fade.FadeIn();
                        nextPhase();
                    }
                    break;
            }
            
            previous = kState;
            previousMouse = currentMouse;
            base.Update(gameTime);
        }

        protected override void Draw(GameTime gameTime)
        {

            GraphicsDevice.Clear(Color.Black);
            GraphicsDevice.SetRenderTarget(scaler.lowResTarget);

            //LOW RES RENDERING LAYER

            //This line  makes the pixels scale pixel perfect(no blur)
            _spriteBatch.Begin(SpriteSortMode.Deferred, null, SamplerState.PointClamp);
            switch (DevState)
            {
                case DevState.Battle:
                    GraphicsDevice.Clear(enemy.Color);
                    _spriteBatch.Draw(pixel, new Rectangle(2, 92, 266, 150), Color.White);
                    _spriteBatch.Draw(pixel, new Rectangle(3, 93, 264, 148), enemy.Color);
                    //_spriteBatch.Draw(board, new Rectangle(0, 0, 810, 810), enemy.Color);
                    player.DrawCards(_spriteBatch, cardSprites, new Vector2(10, 100));
                    enemy.DrawCards(_spriteBatch, cardSprites, new Vector2(190, 100));
                    break;
                case DevState.Menu:
                    GraphicsDevice.Clear(Color.Yellow);
                    break;
                case DevState.Exploration:
                    GraphicsDevice.Clear(Color.Black);
                    _spriteBatch.Draw(bkgexp, bkgmanager, Color.White);
                    inspector.Draw(_spriteBatch);
                    break;

            }
            
           
            _spriteBatch.End();

            // HI RES RENDERING LAYER

            GraphicsDevice.SetRenderTarget(scaler.hiResTarget);
            _spriteBatch.Begin(SpriteSortMode.Deferred, null, SamplerState.PointClamp);
            GraphicsDevice.Clear(Color.Transparent);
            if (!fade.fadeIn)
            {
                switch (DevState)
                {
                    case DevState.Battle:
                        _spriteBatch.Draw(boardFront, new Rectangle(0, 35, 810, 810), Color.White);
                        if (enemy.Name == "Mr. House") { _spriteBatch.Draw(bleed, new Rectangle(0, 35, 810, 810), Color.White); }
                        Utility.drawFittedText(_spriteBatch, font, BattleNum.ToString(), new Rectangle(0, 790, 20, 20), Color.White);
                        battleRenderer.Draw(_spriteBatch, battle, player, enemy, buttons);
                        break;
                    case DevState.Menu:
                        _spriteBatch.Draw(bkg, new Rectangle(0, 0, 810, 810), Color.White);
                        Utility.drawFittedText(_spriteBatch, font, $"Current Battle: {BattleNum}", new Rectangle(470, 450, 200, 200), Color.White);
                        foreach (Button b in buttons) b.Draw(_spriteBatch);
                        break;
                    case DevState.Cutscene:
                        cutsceneManager.Draw(_spriteBatch, font);
                        break;
                }
            }
            textbox.Draw(_spriteBatch, font, new Rectangle(0, 550, 810, 260), Color.White);
            fade.Draw(_spriteBatch);
            _spriteBatch.End();

            GraphicsDevice.SetRenderTarget(null);

            //FINAL RENDER (Don't put stuff in this one)

            _spriteBatch.Begin(SpriteSortMode.Deferred, null, SamplerState.PointClamp);
            _spriteBatch.Draw(scaler.lowResTarget,scaler.renderDestination, Color.White);
            _spriteBatch.Draw(scaler.hiResTarget, scaler.renderDestination, Color.White);
            _spriteBatch.End();

            base.Draw(gameTime);
        }
        
        //sets up buttons for battlestate
        private void resetBattle()
        {
            KeyboardState kstate = Keyboard.GetState();
            
            battle = battle.SetBattle(BattleNum, handSprites);
            player = battle.player;
            enemy = battle.enemy;

            //player.setAnimatedHand(new AnimatedHand(handSprites, new Vector2(-100, 550), Color.MediumPurple, false));
            //enemy.setAnimatedHand(new AnimatedHand(handSprites, new Vector2(490, 550), Color.White, true));

            buttons = new List<Button>();
            buttons.Add(new Button(GraphicsDevice, new Rectangle(305, 600, 200, 75), "HIT", font, Color.Yellow));
            buttons.Add(new Button(GraphicsDevice, new Rectangle(305, 685, 200, 75), "STAND", font, Color.Red));
            buttons.Add(new Button(GraphicsDevice, new Rectangle(305, 400, 200, 75), "NEXT ROUND", font, Color.Blue));
            buttons.Add(new Button(GraphicsDevice, new Rectangle(305, 400, 200, 75), "Try Again", font, Color.Red));
            buttons[0].OnButtonLeftClick += battle.PlayerHit;
            //buttons[0].OnButtonLeftClick += () => playerHand.goTo(HandState.Hit, new Vector2(-80, 500));
            buttons[1].OnButtonLeftClick += battle.playerStand;
            //buttons[1].OnButtonLeftClick += () => playerHand.goTo(HandState.Stand, new Vector2(-40, 400));
            buttons[2].OnButtonLeftClick += battle.resetCards;
            buttons[3].OnButtonLeftClick += resetBattle;
            buttons[3].OnButtonLeftClick += fade.FadeIn;
            DevState = DevState.Battle;
        }
        //sets up buttons for menuState
        private void setMenu()
        {
            buttons.Clear();
            buttons.Add(new Button(GraphicsDevice, new Rectangle(470, 600, 200, 75), "START", font, Color.Transparent));
            buttons.Add(new Button(GraphicsDevice, new Rectangle(470, 685, 200, 75), "[DEV] - CHANGE BATTLE", font, Color.Transparent));
            //buttons[0].OnButtonLeftClick += resetBattle;
            buttons[0].OnButtonLeftClick += fade.FadeIn;
            buttons[0].OnButtonLeftClick += () => { BattleNum = BattleNum; step = 0; DevState = DevState.Cutscene; nextPhase(); };
            buttons[1].OnButtonLeftClick += increaseBattleNum;
        }

        //stops battlenum from reaching unfinished/unimplemented battles.
        private void increaseBattleNum()
        {
            BattleNum++;
            if (BattleNum == 6 || BattleNum == 5) { BattleNum = 7;}
            if (BattleNum >= 9) { BattleNum = 0; }
        }


        //Automatically advances throught the gameloop, including special cases for cutscene 0, battle 8, etc.
        private void nextPhase()
        {
            if ((BattleNum == 5) || (BattleNum == 6)) { BattleNum = 7;}

            if (BattleNum == 9 && step > 1)
            {
                DevState = DevState.Menu;
                setMenu();
                return;
            }

            switch(step)
            {
                case 0:
                    if (BattleNum == 0 || BattleNum >= 8)
                    {
                        
                        step = 1;
                        goto case 1;
                    }
                    else
                    {
                        DevState = DevState.Exploration;
                        if (BattleNum == 1) { textbox.startText(Utility.getText("//CUTSCENE INTRO")); }
                        inspector.location = new Vector2(20,170);
                        step = 1;
                    }
                    break;
                case 1:
                    DevState = DevState.Cutscene;
                    cutsceneManager.PlayCutscene(BattleNum, $"//CUTSCENE {BattleNum}");
                    step = 2;
                    break;
                case 2:
                    if (BattleNum == 0)
                    {
                        BattleNum = 1;
                        step = 0;
                        goto case 0;
                    }
                    else
                    {
                        resetBattle();
                        step = 3;
                    }
                    break;
                case 3:
                    BattleNum++;
                    step = 0;
                    nextPhase();
                    break;
            }
        }

        //Loads all of the cutscenes into a list
        private List<List<Texture2D>> LoadCutscenes(ContentManager content)
        {
            List<List<Texture2D>> cutsceneList = new List<List<Texture2D>>();
            int[] frameNumber = new int[] { 3, 6, 6, 9, 7, 0, 0, 8, 10, 5 };

            for (int i = 0; i < frameNumber.Length; i++)
            {
                List<Texture2D> currentCutscene = new List<Texture2D>();

                for (int j = 1; j <= frameNumber[i]; j++)
                {
                    currentCutscene.Add(content.Load<Texture2D>($"Cutscenes/Cutscene_{i}_{j}"));
                }

                cutsceneList.Add(currentCutscene);
            }

            List<Texture2D> currentCutscene2 = new List<Texture2D>();
            currentCutscene2.Add(content.Load<Texture2D>($"Cutscenes/Cutscene_Intermission"));
            cutsceneList.Add(currentCutscene2);

            return cutsceneList;


        }
    }
}
