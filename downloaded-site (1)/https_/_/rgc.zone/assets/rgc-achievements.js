(function () {
    (function injectOnline() {
        try {
            if (document.querySelector('script[src*="rgc-online.js"]')) return;
            var s = document.createElement('script');
            s.src = '/assets/rgc-online.js?v=20260917-on4';
            s.async = true;
            (document.head || document.documentElement).appendChild(s);
        } catch (e) {}
    })();

    const PROFILE_STORAGE_KEY = 'rgcTelegramProfileV2';
    const EVENT_ENDPOINT = 'https://carter54.pythonanywhere.com/telegram_profile/event';
    const EVENT_QUEUE_KEY = 'rgcAchievementEventQueue';
    const LOCAL_STATE_KEY = 'rgcLocalAchievementState';
    const MAX_QUEUE_LENGTH = 80;

    const ACHIEVEMENT_METADATA = [
        { id: 'welcome', title_ru: 'Добро пожаловать', title_en: 'Welcome', description_ru: 'Запустить любую игру впервые', description_en: 'Launch any game for the first time', type: 'launch', threshold: 1 },
        { id: 'arrakis', title_ru: 'За Арракис!', title_en: 'For Arrakis!', description_ru: 'Запустить игру Dune II TG', description_en: 'Launch Dune II TG', type: 'dune', threshold: 1 },
        { id: 'hell_freeze', title_ru: 'В Аду похолодело!', title_en: 'Hell Froze Over!', description_ru: 'Запустить игру Doom I & II', description_en: 'Launch Doom I & II', type: 'doom', threshold: 1 },
        { id: 'shake_it', title_ru: 'Shake it Babe!', title_en: 'Shake it Babe!', description_ru: 'Запустить Duke Nukem 3DTG', description_en: 'Launch Duke Nukem 3DTG', type: 'duke', threshold: 1 },
        { id: 'nostalgia', title_ru: 'Как в детстве', title_en: 'Like in Childhood', description_ru: 'Запустить любую игру PSXTG', description_en: 'Launch any PSXTG game', type: 'psx', threshold: 1 },
        { id: 'dendy_love', title_ru: 'Мы все любим денди', title_en: 'We all love Dendy', description_ru: 'Запустить любую игру NES', description_en: 'Launch any NES game', type: 'nes', threshold: 1 },
        { id: 'thanks_staying', title_ru: 'Спасибо, что ты с нами!', title_en: 'Thanks for staying with us!', description_ru: 'Перейти в Новости и Обновления', description_en: 'Visit News & Updates', type: 'news', threshold: 1 },
        { id: 'just_look', title_ru: 'Просто посмотреть', title_en: 'Just Looking', description_ru: 'Запустить 5 игр', description_en: 'Launch 5 games', type: 'launch', threshold: 5 },
        { id: 'beginner', title_ru: 'Начинающий', title_en: 'Beginner', description_ru: 'Запустить 10 игр', description_en: 'Launch 10 games', type: 'launch', threshold: 10 },
        { id: 'amateur', title_ru: 'Любитель', title_en: 'Amateur', description_ru: 'Запустить 25 игр', description_en: 'Launch 25 games', type: 'launch', threshold: 25 },
        { id: 'professional', title_ru: 'Профессионал', title_en: 'Professional', description_ru: 'Запустить 50 игр', description_en: 'Launch 50 games', type: 'launch', threshold: 50 },
        { id: 'retrogamer', title_ru: 'Ретрогеймер', title_en: 'Retro Gamer', description_ru: 'Запуск 100 игр', description_en: 'Launch 100 games', type: 'launch', threshold: 100 },
        { id: 'support_master', title_ru: 'ЛУЧШИЙ!', title_en: 'THE BEST!', description_ru: 'Зайти в раздел Поддержать', description_en: 'Visit the Support section', type: 'support', threshold: 1 },
        { id: 'srq_welcome', title_ru: 'Привет, Греф!', title_en: 'Hello, Gref!', description_ru: 'Запустить Space Rangers Quests', description_en: 'Launch Space Rangers Quests', type: 'srq', threshold: 1 },
        { id: 'heretic_welcome', title_ru: 'Еретик!', title_en: 'Heretic!', description_ru: 'Запустить Herexen', description_en: 'Launch Herexen', type: 'herexen', threshold: 1 },
        { id: 'wolf_welcome', title_ru: 'Против всего плохого!', title_en: 'Against all evil!', description_ru: 'Запустить Wolf 3DTG', description_en: 'Launch Wolf 3DTG', type: 'wolf', threshold: 1 },
        { id: 'quake_welcome', title_ru: 'Настоящее 3D', title_en: 'Real 3D', description_ru: 'Запустить Quake TG', description_en: 'Launch Quake TG', type: 'quake', threshold: 1 },
        { id: 'first_fav', title_ru: 'Первая покупка', title_en: 'First Purchase', description_ru: 'Добавить одну любую игру в избранное', description_en: 'Add any game to favorites', type: 'fav_count', threshold: 1 },
        { id: 'collector_beginner', title_ru: 'Начинающий коллекционер', title_en: 'Beginner Collector', description_ru: 'Добавить 10 игр в избранное', description_en: 'Add 10 games to favorites', type: 'fav_count', threshold: 10 },
        { id: 'sound_in_your_head', title_ru: 'Звук в твоей голове', title_en: 'Sound In Your Head', description_ru: 'Запустить любую игру Sega Megadrive', description_en: 'Launch any Sega Megadrive game', type: 'sega', threshold: 1 },
        { id: 'battlecity', title_ru: 'Танкист', title_en: 'Tanker', description_ru: 'Запустить BattleCity на NES', description_en: 'Launch BattleCity on NES', type: 'battlecity', threshold: 1 },
        { id: 'not_donkey', title_ru: 'Он вам не Donkey!', title_en: 'He Is Not Donkey!', description_ru: 'Запустить Donkey Kong Country на SNES', description_en: 'Launch Donkey Kong Country on SNES', type: 'donkey_country', threshold: 1 },
        { id: 'button_destroyer', title_ru: 'Уничтожитель кнопок', title_en: 'Button Destroyer', description_ru: 'Запустить Gravity Defied в JavaGames', description_en: 'Launch Gravity Defied on JavaGames', type: 'gravity', threshold: 1 },
        { id: 'sonic_speed', title_ru: 'Быстрее ветра', title_en: 'Faster Than the Wind', description_ru: 'Запустить Sonic The Hedgehog на Sega Megadrive', description_en: 'Launch Sonic The Hedgehog on Sega Megadrive', type: 'sonic', threshold: 1 },
        { id: 'antagonist', title_ru: 'Антагонист', title_en: 'Antagonist', description_ru: 'Запустить Wario Land 4 на GBA', description_en: 'Launch Wario Land 4 on GBA', type: 'wario', threshold: 1 },
        { id: 'from_russia_with_love', title_ru: 'From Russia With Love!', title_en: 'From Russia With Love!', description_ru: 'Запустить Tetris на GBC', description_en: 'Launch Tetris on GBC', type: 'tetris', threshold: 1 },
        { id: 'tekken_master', title_ru: 'Железный Кулак', title_en: 'Iron Fist', description_ru: 'Запустить Tekken 3 на PSXTG', description_en: 'Launch Tekken 3 on PSXTG', type: 'tekken', threshold: 1 },
        { id: 'cool_lizard', title_ru: 'Крутая ящерица', title_en: 'Cool Lizard', description_ru: 'Запустить GEX на 3DO', description_en: 'Launch GEX on 3DO', type: 'gex', threshold: 1 },
        { id: 'big_n', title_ru: 'Большая N', title_en: 'Big N', description_ru: 'Запустить любую игру N64', description_en: 'Launch any N64 game', type: 'n64', threshold: 1 },
        { id: 'its_thinking', title_ru: 'It\'s thinking...', title_en: 'It\'s thinking...', description_ru: 'Запустить любую игру Dreamcast', description_en: 'Launch any Dreamcast game', type: 'dreamcast', threshold: 1 },
        { id: 'i_was_there_gandalf', title_ru: 'Я был там Гендальф!', title_en: 'I Was There, Gandalf!', description_ru: 'Запустить любую игру Commodore 64', description_en: 'Launch any Commodore 64 game', type: 'c64', threshold: 1 },
        { id: 'twice_as_cool', title_ru: 'В два раза круче', title_en: 'Twice As Cool', description_ru: 'Запустить любую игру Sega 32X', description_en: 'Launch any Sega 32X game', type: 'sega32x', threshold: 1 },
        { id: 'real_virtuality', title_ru: 'Реальная виртуальность', title_en: 'Real Virtuality', description_ru: 'Запустить любую игру Virtual Boy', description_en: 'Launch any Virtual Boy game', type: 'virtualboy', threshold: 1 },
        { id: 'two_buttons_too', title_ru: 'Здесь тоже две кнопки', title_en: 'Two Buttons Here Too', description_ru: 'Запустить любую игру Sega Master System', description_en: 'Launch any Sega Master System game', type: 'segamaster', threshold: 1 },
        { id: 'hedgehog_in_pocket', title_ru: 'Ёжик в кармане', title_en: 'Hedgehog In Pocket', description_ru: 'Запустить любую игру Sega Game Gear', description_en: 'Launch any Sega Game Gear game', type: 'gamegear', threshold: 1 },
        { id: 'fast_cat', title_ru: 'Быстрая кошка', title_en: 'Fast Cat', description_ru: 'Запустить любую игру Atari Jaguar', description_en: 'Launch any Atari Jaguar game', type: 'atarijaguar', threshold: 1 },
        { id: 'not_gamepad_joystick', title_ru: 'Не геймпад, а джойстик!', title_en: 'Not a Gamepad, a Joystick!', description_ru: 'Запустить любую игру Atari 2600', description_en: 'Launch any Atari 2600 game', type: 'atari2600', threshold: 1 },
        { id: 'digs', title_ru: 'Раскопки', title_en: 'Digs', description_ru: 'Запустить E.T. - The Extra-Terrestrial на Atari 2600', description_en: 'Launch E.T. - The Extra-Terrestrial on Atari 2600', type: 'et', threshold: 1 },
        { id: 'poly_racing', title_ru: 'ПолиГонки', title_en: 'Poly Racing', description_ru: 'Запустить Virtua Racing Deluxe на Sega 32X', description_en: 'Launch Virtua Racing Deluxe on Sega 32X', type: 'virtua_racing_deluxe', threshold: 1 },
        { id: 'origins', title_ru: 'Истоки', title_en: 'Origins', description_ru: 'Запустить DosZone Mobile', description_en: 'Launch DosZone Mobile', type: 'doszone_mobile', threshold: 1 },
        { id: 'check_something', title_ru: 'Кое что проверю', title_en: 'Let Me Check Something', description_ru: 'Запустить Ultimate Mortal Kombat 3 на Sega Megadrive', description_en: 'Launch Ultimate Mortal Kombat 3 on Sega Megadrive', type: 'umk3', threshold: 1 },
        { id: 'like_minded', title_ru: 'Единомышленник', title_en: 'Like-minded', description_ru: 'Запустить Dendy и Sega от RetroHubGames', description_en: 'Launch Dendy and Sega from RetroHubGames', type: 'retrohub', threshold: 2 },
        { id: 'tv_remote', title_ru: 'Пульт от телека', title_en: 'TV Remote', description_ru: 'Запустить любую игру Atari 5200', description_en: 'Launch any Atari 5200 game', type: 'atari5600', threshold: 1 },
        { id: 'wings_of_night', title_ru: 'На крыльях ночи!', title_en: 'On the Wings of Night!', description_ru: 'Запустить Darkwing Duck на NESTG', description_en: 'Launch Darkwing Duck on NESTG', type: 'darkwing_duck', threshold: 1 },
        { id: 'gamer_harry', title_ru: 'Ты геймер Гарри!', title_en: 'You Are a Gamer, Harry!', description_ru: 'Запустить Harry Potter на PSXTG', description_en: 'Launch Harry Potter on PSXTG', type: 'harry_potter', threshold: 1 },
        { id: 'pizza_ordered', title_ru: 'Пиццу заказывали?', title_en: 'Pizza Delivery?', description_ru: 'Запустить Teenage Mutant Ninja Turtles - The Hyperstone Heist на Sega Megadrive', description_en: 'Launch TMNT - The Hyperstone Heist on Sega Megadrive', type: 'hyperstone_heist', threshold: 1 },
        { id: 'konami_30lives', title_ru: '30 жизней', title_en: '30 Lives', description_ru: 'Секретное достижение', description_en: 'Secret achievement', type: 'konami_30lives', threshold: 1, secret: true },
        { id: 'author_name', title_ru: 'Скажи мое имя!', title_en: 'Say My Name!', description_ru: 'Назвать имя автора проекта', description_en: 'Name the project author', type: 'author_name', threshold: 1, secret: true },
        { id: 'lobby_online', title_ru: 'Онлайн', title_en: 'Online', description_ru: 'Зайти в мультиплеер лобби', description_en: 'Enter the multiplayer lobby', type: 'lobby_enter', threshold: 1 },
        { id: 'lobby_created', title_ru: 'Заходи, я создал!', title_en: 'Come In, I Created It!', description_ru: 'Создать сервер в мультиплеер лобби', description_en: 'Create a server in the multiplayer lobby', type: 'lobby_create_server', threshold: 1 },
        { id: 'lobby_join', title_ru: 'Вместе веселее', title_en: 'More Fun Together', description_ru: 'Зайти в чью-то созданную игру в мультиплеере', description_en: 'Join someone else\'s game in multiplayer', type: 'lobby_join_game', threshold: 1 },
        { id: 'zx_origins', title_ru: 'Истоки ретрогейминга', title_en: 'Origins of Retro Gaming', description_ru: 'Запустить любую игру ZX Spectrum', description_en: 'Launch any ZX Spectrum game', type: 'zxspectrum', threshold: 1 },
        { id: 'nds_pro', title_ru: 'Приставочка на прокачку', title_en: 'Console Level Up', description_ru: 'Запустить любую игру NDS', description_en: 'Launch any NDS game', type: 'nds', threshold: 1 },
        { id: 'random_god', title_ru: 'Бог рандома', title_en: 'God of Random', description_ru: 'Обновить случайную игру 25 раз на главной', description_en: 'Refresh the random game 25 times on the main page', type: 'random_refresh_25', threshold: 25 },
        { id: 'netplay_chipndale', title_ru: 'Меня сегодня друг кинул...', title_en: 'My Friend Bailed Today...', description_ru: 'Создать сервер с Chip \'n Dale - Rescue Rangers в мультиплеере', description_en: 'Create a server with Chip \'n Dale - Rescue Rangers in multiplayer', type: 'netplay_chipndale', threshold: 1 },
        { id: 'yourmulator_launch', title_ru: 'Спасибо, у меня с собой', title_en: 'Thanks, I Have My Own', description_ru: 'Запустить Yourmulator', description_en: 'Launch Yourmulator', type: 'yourmulator', threshold: 1 },
        { id: 'ps2web_visit', title_ru: 'Новое поколение', title_en: 'New Generation', description_ru: 'Зайти в раздел PS2 Web', description_en: 'Visit the PS2 Web section', type: 'ps2web', threshold: 1 },
        { id: 'netplay_rocknroll', title_ru: 'Рок\'нРолл жив!', title_en: 'Rock \'n Roll is Alive!', description_ru: 'Создать сервер с Rock n\' Roll Racing в мультиплеере', description_en: 'Create a server with Rock n\' Roll Racing in multiplayer', type: 'netplay_rocknroll', threshold: 1 },
        { id: 'netplay_umk3_server', title_ru: 'Смертельная битва', title_en: 'Mortal Kombat', description_ru: 'Создать сервер с Ultimate Mortal Kombat 3 в мультиплеере', description_en: 'Create a server with Ultimate Mortal Kombat 3 in multiplayer', type: 'netplay_umk3', threshold: 1 },
        { id: 'netplay_hyperstone_server', title_ru: 'Пицца на двоих', title_en: 'Pizza for Two', description_ru: 'Создать сервер с Teenage Mutant Ninja Turtles - The Hyperstone Heist в мультиплеере', description_en: 'Create a server with TMNT - The Hyperstone Heist in multiplayer', type: 'netplay_hyperstone', threshold: 1 },
        { id: 'netplay_worms', title_ru: 'Ты подожди у меня!', title_en: 'You Wait For Me!', description_ru: 'Создать сервер с Worms Armageddon в мультиплеере', description_en: 'Create a server with Worms Armageddon in multiplayer', type: 'netplay_worms', threshold: 1 },
        { id: 'netplay_sor2', title_ru: 'Вдвоём по улицам ярости', title_en: 'Streets of Rage Together', description_ru: 'Создать сервер с Streets of Rage 2 в мультиплеере', description_en: 'Create a server with Streets of Rage 2 in multiplayer', type: 'netplay_sor2', threshold: 1 },
        { id: 'play_1min', title_ru: 'Я просто спросить!', title_en: 'Just Asking!', description_ru: 'Поиграть в любую игру 1 минуту', description_en: 'Play any game for 1 minute', type: 'play_1min', threshold: 1 },
        { id: 'play_20min', title_ru: 'Обеденный перерыв', title_en: 'Lunch Break', description_ru: 'Поиграть в любую игру 20 минут', description_en: 'Play any game for 20 minutes', type: 'play_20min', threshold: 1 },
        { id: 'play_1hr', title_ru: 'Почти прошел', title_en: 'Almost Beat It', description_ru: 'Поиграть в любую игру 1 час', description_en: 'Play any game for 1 hour', type: 'play_1hr', threshold: 1 },
        { id: 'play_2hr', title_ru: 'Выходной', title_en: 'Day Off', description_ru: 'Поиграть в любую игру 2 часа', description_en: 'Play any game for 2 hours', type: 'play_2hr', threshold: 1 },
        { id: 'save_any', title_ru: 'Я в домике!', title_en: 'I\'m Safe!', description_ru: 'Сохраниться в любой игре', description_en: 'Save in any game', type: 'save_any', threshold: 1 }
    ];

    const TOAST_SHOWN_KEY = 'rgcAchievementToastShown';
    const triggeredSpecialEvents = new Set();
    let toastContainer = null;
    // В Telegram WebApp (особенно в fullscreen) верхняя панель может перекрывать UI.
    // Делаем запас побольше, но стараемся брать значение из Telegram API если доступно.
    const TG_HEADER_OFFSET_PX = 88;

    function getTelegramUserId() {
        try {
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            if (tgUser?.id) return String(tgUser.id);
        } catch (e) {}
        try {
            const initRaw = window.Telegram?.WebApp?.initData || window.currentInitData || '';
            if (initRaw) {
                const params = new URLSearchParams(initRaw);
                const userRaw = params.get('user');
                if (userRaw) {
                    const parsed = JSON.parse(decodeURIComponent(userRaw));
                    if (parsed?.id) return String(parsed.id);
                }
            }
        } catch (e) {}
        return null;
    }

    function scopedKey(base) {
        const uid = getTelegramUserId();
        return uid ? `${base}:${uid}` : base;
    }

    function getProfileStorageKey() {
        return scopedKey(PROFILE_STORAGE_KEY);
    }

    function getEventQueueKey() {
        return scopedKey(EVENT_QUEUE_KEY);
    }

    function getLocalStateKey() {
        return scopedKey(LOCAL_STATE_KEY);
    }

    function getToastKey() {
        return scopedKey(TOAST_SHOWN_KEY);
    }

    function getUserScope() {
        return getTelegramUserId() || 'anon';
    }

    function getLatestProfile() {
        const scope = getUserScope();
        const map = window.__rgcLatestProfiles || {};
        return map[scope] || null;
    }

    function setLatestProfile(profile) {
        const scope = getUserScope();
        window.__rgcLatestProfiles = window.__rgcLatestProfiles || {};
        window.__rgcLatestProfiles[scope] = profile;
        window.latestProfile = profile;
    }

    function ensureTelegramLayoutStyles() {
        if (document.getElementById('rgc-telegram-layout-style')) return;
        const style = document.createElement('style');
        style.id = 'rgc-telegram-layout-style';
        style.textContent = `
            @media (pointer: coarse) {
                /* Telegram WebApp top chrome overlaps content: add offset */
                /* Если это "единый сайт" со страницами (.page), сдвигаем сами страницы */
                html.rgc-has-pages body.telegram-webapp {
                    padding-top: env(safe-area-inset-top, 0px) !important;
                }
                html.rgc-has-pages body.telegram-webapp .page.active {
                    padding-top: var(--rgc-tg-header-offset, ${TG_HEADER_OFFSET_PX}px) !important;
                }

                /* Для отдельных страниц (порты/эмуляторы), где нет .page — сдвигаем body */
                html:not(.rgc-has-pages) body.telegram-webapp {
                    padding-top: calc(env(safe-area-inset-top, 0px) + var(--rgc-tg-header-offset, ${TG_HEADER_OFFSET_PX}px)) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function applyTelegramLayoutFixes() {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        // Помечаем, что это многостраничный "единый сайт", если есть .page
        try {
            if (document.querySelector('.page')) {
                document.documentElement.classList.add('rgc-has-pages');
            } else {
                document.documentElement.classList.remove('rgc-has-pages');
            }
        } catch (e) {}

        // Class used by some pages already; ensure it's present everywhere.
        if (document.body) {
            document.body.classList.add('telegram-webapp');
        } else {
            document.addEventListener('DOMContentLoaded', () => document.body?.classList.add('telegram-webapp'), { once: true });
        }
        ensureTelegramLayoutStyles();

        // Allow host pages to override, but default to typical Telegram header height.
        try {
            const topInset =
                (typeof tg.contentSafeAreaInset?.top === 'number' ? tg.contentSafeAreaInset.top : null) ??
                (typeof tg.safeAreaInset?.top === 'number' ? tg.safeAreaInset.top : null) ??
                0;

            const computed = Math.max(TG_HEADER_OFFSET_PX, Math.ceil(topInset || 0));
            document.documentElement.style.setProperty('--rgc-tg-header-offset', `${computed}px`);
        } catch (e) {
            document.documentElement.style.setProperty('--rgc-tg-header-offset', `${TG_HEADER_OFFSET_PX}px`);
        }
    }

    function isOnline() {
        return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    }

    function getPreferredLang() {
        const active = document.querySelector?.('.lang-btn.active');
        const lang = active?.getAttribute('data-lang');
        if (lang === 'ru' || lang === 'en') return lang;
        const docLang = document.documentElement?.getAttribute('lang');
        if (docLang === 'ru' || docLang === 'en') return docLang;
        return 'ru';
    }

    function ensureToastStyles() {
        if (document.getElementById('rgc-achievement-toast-style')) return;
        const style = document.createElement('style');
        style.id = 'rgc-achievement-toast-style';
        style.textContent = `
            .rgc-achievement-toast-host {
                position: fixed;
                top: env(safe-area-inset-top, 0px);
                left: 50%;
                transform: translateX(-50%);
                z-index: 99999;
                width: min(92vw, 360px);
                pointer-events: none;
            }
            .rgc-achievement-toast {
                margin: 10px auto 0;
                background: rgba(15, 15, 18, 0.94);
                border: 2px solid rgba(255, 204, 0, 0.75);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45);
                border-radius: 8px;
                padding: 12px 14px;
                color: #fff;
                font-family: 'Press Start 2P', system-ui, sans-serif;
                font-size: 10px;
                line-height: 1.4;
                text-transform: uppercase;
                opacity: 0;
                transform: translateY(-8px);
                transition: opacity 0.25s ease, transform 0.25s ease;
            }
            .rgc-achievement-toast.show {
                opacity: 1;
                transform: translateY(0);
            }
            .rgc-achievement-toast .rgc-achievement-title {
                color: #ffcc00;
                margin-bottom: 6px;
            }
        `;
        document.head.appendChild(style);
    }

    function ensureToastContainer() {
        if (toastContainer) return toastContainer;
        ensureToastStyles();
        const host = document.createElement('div');
        host.className = 'rgc-achievement-toast-host';
        document.body.appendChild(host);
        toastContainer = host;
        return host;
    }

    function readToastShown() {
        const saved = readJSON(getToastKey());
        return new Set(Array.isArray(saved) ? saved : []);
    }

    function persistToastShown(set) {
        persistJSON(getToastKey(), Array.from(set));
    }

    function getMetaById(id) {
        return ACHIEVEMENT_METADATA.find(meta => meta.id === id);
    }

    function isLobbyPage() {
        return (window.location.pathname || '').toLowerCase().indexOf('lobby') !== -1;
    }

    let achievementsOverlayEl = null;

    function ensureAchievementsOverlayStyles() {
        if (document.getElementById('rgc-achievements-overlay-style')) return;
        const style = document.createElement('style');
        style.id = 'rgc-achievements-overlay-style';
        style.textContent = `
            .rgc-achievements-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                z-index: 99998; background: var(--bg-primary, #0d1b2a);
                overflow-y: auto; padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
                font-family: 'Press Start 2P', cursive;
            }
            .rgc-achievements-overlay .rgc-achievements-container { max-width: 100%; padding: 20px 15px; }
            .rgc-achievements-overlay .rgc-achievements-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .rgc-achievements-overlay .rgc-achievements-back {
                display: inline-flex; align-items: center; justify-content: center;
                padding: 10px 14px; background: var(--bg-secondary); color: var(--accent-primary);
                border: 2px solid var(--accent-primary); cursor: pointer; font-size: 10px;
                text-decoration: none; box-shadow: 3px 3px 0 #000;
            }
            .rgc-achievements-overlay .rgc-achievements-title { font-size: 12px; color: var(--accent-primary); }
            .rgc-achievements-overlay .achievement-list {
                display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 15px; margin-top: 20px; min-height: 200px;
            }
            .rgc-achievements-overlay .achievement-card {
                background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1);
                border-radius: 8px; padding: 15px; display: flex; flex-direction: column; gap: 10px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            }
            .rgc-achievements-overlay .achievement-card.unlocked {
                border-color: var(--accent-primary); background: rgba(196,30,58,0.1);
                box-shadow: 0 0 15px rgba(196,30,58,0.2);
            }
            .rgc-achievements-overlay .achievement-title { font-size: 10px; font-weight: bold; color: var(--text-primary); line-height: 1.4; text-transform: uppercase; }
            .rgc-achievements-overlay .achievement-description { font-size: 8px; color: var(--text-secondary); line-height: 1.4; flex-grow: 1; }
            .rgc-achievements-overlay .achievement-status { font-size: 8px; text-align: right; color: var(--accent-secondary); font-weight: bold; }
            .rgc-achievements-overlay .achievement-progress-bar { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
            .rgc-achievements-overlay .achievement-progress-meter { display: block; height: 100%; background: var(--accent-primary); transition: width 0.5s ease; }
            @media (max-width: 480px) {
                .rgc-achievements-overlay .achievement-list { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(style);
    }

    function getOrCreateAchievementsContainer() {
        const listEl = document.getElementById('achievementList');
        if (listEl) return { listEl: listEl, overlay: null };

        if (achievementsOverlayEl && achievementsOverlayEl.parentNode) {
            const list = achievementsOverlayEl.querySelector('.achievement-list');
            if (list) return { listEl: list, overlay: achievementsOverlayEl };
        }

        ensureAchievementsOverlayStyles();
        const overlay = document.createElement('div');
        overlay.className = 'rgc-achievements-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Achievements');
        const lang = getPreferredLang();
        const titleText = lang === 'en' ? 'MY ACHIEVEMENTS' : 'МОИ ДОСТИЖЕНИЯ';
        const backText = lang === 'en' ? 'Back' : 'Назад';
        overlay.innerHTML = `
            <div class="rgc-achievements-container">
                <div class="rgc-achievements-header">
                    <button type="button" class="rgc-achievements-back" aria-label="${backText}">← ${backText}</button>
                    <h2 class="rgc-achievements-title">🏆 ${titleText}</h2>
                    <span style="width:80px;"></span>
                </div>
                <div class="achievement-list" id="rgcAchievementListOverlay"></div>
            </div>
        `;
        const overlayListEl = overlay.querySelector('.achievement-list');
        const backBtn = overlay.querySelector('.rgc-achievements-back');
        backBtn.addEventListener('click', function () {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            achievementsOverlayEl = null;
        });
        document.body.appendChild(overlay);
        achievementsOverlayEl = overlay;
        return { listEl: overlayListEl, overlay: overlay };
    }

    function renderAchievements(profile) {
        if (isLobbyPage()) return;

        const container = getOrCreateAchievementsContainer();
        const listEl = container.listEl;
        const overlay = container.overlay;
        if (overlay) overlay.style.display = '';

        let p = profile || (typeof window.latestProfile !== 'undefined' ? window.latestProfile : null) || mergeProfileWithLocal({});
        if (!p || !p.achievements || !p.achievements.length) {
            p = mergeProfileWithLocal(p || {});
        }
        const lang = getPreferredLang();
        const loadingText = lang === 'en' ? 'Loading...' : 'ЗАГРУЗКА...';
        const telegramOnlyText = lang === 'en' ? 'ACHIEVEMENTS ONLY IN TELEGRAM' : 'ДОСТИЖЕНИЯ ДОСТУПНЫ ТОЛЬКО В TELEGRAM';
        const unlockedText = lang === 'en' ? 'UNLOCKED' : 'РАЗБЛОКИРОВАНО';

        if (!p.achievements || !p.achievements.length) {
            var isTGEmpty = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
            listEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);font-size:10px;">' + (isTGEmpty ? loadingText : telegramOnlyText) + '</div>';
            return;
        }

        const states = (p.achievements || []).filter(function (s) {
            return !s.secret || s.unlocked;
        });
        if (!states.length) {
            const isTG = !!(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
            listEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);font-size:10px;">' + (isTG ? loadingText : telegramOnlyText) + '</div>';
            return;
        }

        var html = '';
        for (var i = 0; i < states.length; i++) {
            var state = states[i];
            var meta = getMetaById(state.id);
            var title = (lang === 'en' ? (state.title_en || (meta && meta.title_en)) : (state.title_ru || (meta && meta.title_ru))) || (meta && meta.title_ru) || 'Achievement';
            var description = (lang === 'en' ? (state.description_en || (meta && meta.description_en)) : (state.description_ru || (meta && meta.description_ru))) || (meta && meta.description_ru) || '';
            var progressText = state.unlocked ? unlockedText : (state.progress + '/' + state.threshold);
            var progressPercent = state.threshold ? Math.min((state.progress / state.threshold) * 100, 100) : 0;
            html += '<div class="achievement-card' + (state.unlocked ? ' unlocked' : '') + '">' +
                '<div class="achievement-title">' + title + '</div>' +
                '<div class="achievement-description">' + description + '</div>' +
                '<div class="achievement-progress-bar"><span class="achievement-progress-meter" style="width:' + progressPercent + '%"></span></div>' +
                '<div class="achievement-status">' + progressText + '</div></div>';
        }
        listEl.innerHTML = html;
    }

    function showAchievementToast(meta) {
        if (!meta) return;
        const container = ensureToastContainer();
        const lang = getPreferredLang();
        const title = lang === 'en' ? meta.title_en : meta.title_ru;
        const description = lang === 'en' ? meta.description_en : meta.description_ru;
        const toast = document.createElement('div');
        toast.className = 'rgc-achievement-toast';
        toast.innerHTML = `
            <div class="rgc-achievement-title">🏆 ${title || 'Achievement'}</div>
            <div class="rgc-achievement-desc">${description || ''}</div>
        `;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 250);
        }, 5000);
    }

    function announceAchievement(id) {
        const meta = getMetaById(id);
        if (!meta) return;
        const shown = readToastShown();
        if (shown.has(id)) return;
        shown.add(id);
        persistToastShown(shown);
        showAchievementToast(meta);
    }

    function showAchievementToastById(id) {
        const meta = getMetaById(id);
        if (meta) showAchievementToast(meta);
    }

    function showPendingToastsFromStorage() {
        try {
            var raw = sessionStorage.getItem('rgc_pending_toasts');
            sessionStorage.removeItem('rgc_pending_toasts');
            if (!raw) return;
            var ids = JSON.parse(raw);
            if (!Array.isArray(ids) || ids.length === 0) return;
            var delay = 0;
            ids.forEach(function(id) {
                setTimeout(function() { showAchievementToastById(id); }, delay);
                delay += 2200;
            });
        } catch (e) {}
    }

    function getNormalizedSearchParam(name) {
        try {
            const params = new URLSearchParams(window.location.search);
            const value = params.get(name);
            return value ? value.toLowerCase() : '';
        } catch (error) {
            console.warn('Failed to read URL search param', error);
            return '';
        }
    }

    function normalizeTitle(value) {
        try {
            if (typeof value !== 'string') return '';
            let decoded = value;
            try {
                decoded = decodeURIComponent(value);
            } catch (e) {}

            const file = decoded.replace(/\\/g, '/').split('/').pop() || decoded;
            const noExt = file.replace(/\.[a-z0-9]{1,5}$/i, '');
            return noExt
                .replace(/\s*\[[^\]]*\]\s*/g, ' ')
                .replace(/\s*\([^)]*\)\s*/g, ' ')
                .replace(/[_\-]+/g, ' ')
                .replace(/[^\p{L}\p{N}]+/gu, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        } catch (e) {
            return String(value || '').toLowerCase();
        }
    }

    function inferPlatformFromCore(coreRaw) {
        const core = String(coreRaw || '').toLowerCase();
        if (!core) return null;
        if (core === 'n64') return 'n64';
        if (core === 'dreamcast' || core === 'flycast') return 'dreamcast';
        if (core === 'c64') return 'c64';
        if (core === 'sega32x') return 'sega32x';
        if (core === 'vb') return 'virtualboy';
        if (core === 'segams') return 'segamaster';
        if (core === 'segagg') return 'gamegear';
        if (core === 'jaguar') return 'atarijaguar';
        if (core === 'atari2600') return 'atari2600';
        if (core === 'atari5200') return 'atari5600';
        if (core === 'nes') return 'nes';
        if (core === 'snes') return 'snes';
        if (core === 'pcsx_rearmed') return 'psx';
        if (core.includes('megadrive') || core.includes('genesis') || core.includes('md')) return 'sega';
        return null;
    }

    function markLaunchOnce(signature) {
        const key = `rgc-launch-once:${signature}`;
        try {
            if (sessionStorage.getItem(key)) return false;
            sessionStorage.setItem(key, String(Date.now()));
        } catch (e) {
            if (window.__rgcLaunchOnceSig === signature) return false;
            window.__rgcLaunchOnceSig = signature;
        }
        return true;
    }

    async function trackGameLaunchFromEmulator(payload = {}) {
        const core = payload.core || window.EJS_core || '';
        const platform = inferPlatformFromCore(core);
        const gameUrl = payload.gameUrl || window.EJS_gameUrl || '';
        const gameId = payload.gameId || getNormalizedSearchParam('game') || '';
        const pathname = String(window.location?.pathname || '').toLowerCase();

        const title = normalizeTitle(gameUrl || gameId);
        const signature = [platform || '', gameId || '', title || '', window.location?.pathname || ''].join('|');
        if (!markLaunchOnce(signature)) return;

        // 1) общий запуск (счётчик)
        await trackAchievementEvent('launch');

        // 2) платформенные достижения
        if (platform) {
            await trackAchievementEvent(platform === 'sega' ? 'sega' : platform);
        }

        // 3) специальные игры
        if (platform === 'nes') {
            if (title.includes('battle city') || title.includes('battlecity')) {
                await trackAchievementEvent('battlecity');
            }
            if (title.includes('darkwing duck')) {
                await trackAchievementEvent('darkwing_duck');
            }
        }
        if (platform === 'psx') {
            if (gameId === 'tek3' || title.includes('tekken 3') || title.includes('tekken3')) {
                await trackAchievementEvent('tekken');
            }
            if (String(gameId || '').toLowerCase().startsWith('harry') || title.includes('harry potter')) {
                await trackAchievementEvent('harry_potter');
            }
        }
        if (platform === 'snes') {
            if (title.includes('donkey kong country')) {
                await trackAchievementEvent('donkey_country');
            }
        }
        if (pathname.includes('/games/megadrive/')) {
            if (title.includes('sonic the hedgehog') || title.includes('sonic-the-hedgehog')) {
                await trackAchievementEvent('sonic');
            }
            if (title.includes('ultimate mortal kombat 3') || title.includes('umk3')) {
                await trackAchievementEvent('umk3');
            }
            if (title.includes('hyperstone heist')) {
                await trackAchievementEvent('hyperstone_heist');
            }
        }
        if (pathname.includes('/games/gbatg/')) {
            if (title.includes('wario land 4')) {
                await trackAchievementEvent('wario');
            }
        }
        if (pathname.includes('/games/gbctg/')) {
            // избегаем ложных срабатываний на "Tetris Attack" и т.п.
            if (title === 'tetris') {
                await trackAchievementEvent('tetris');
            }
        }
        if (pathname.includes('/games/3dotg/')) {
            if (String(gameId || '').toLowerCase().includes('gex') || title.includes('gex')) {
                await trackAchievementEvent('gex');
            }
        }
        if (pathname.includes('/games/j2metg/') && pathname.includes('main.html')) {
            // JavaGames: main.html?jars=... (например GDTR.jar)
            try {
                const jars = new URLSearchParams(window.location.search).get('jars') || '';
                const jarsNorm = normalizeTitle(jars);
                if (jarsNorm.includes('gdtr') || jarsNorm.includes('gravitydef')) {
                    await trackAchievementEvent('gravity');
                }
            } catch (e) {}
        }
        if (platform === 'atari2600') {
            const isEt =
                (title.includes('extra terrestrial') && (title.includes('e t') || title.includes('et'))) ||
                title.includes('e t the extra terrestrial');
            if (isEt) {
                await trackAchievementEvent('et');
            }
        }
        if (platform === 'sega32x') {
            if (title.includes('virtua racing deluxe')) {
                await trackAchievementEvent('virtua_racing_deluxe');
            }
        }
        if (pathname.includes('/games/zxspectrum/')) {
            await trackAchievementEvent('zxspectrum');
        }
        if (pathname.includes('/games/nds/')) {
            await trackAchievementEvent('nds');
        }
    }

    function setupEmulatorAutoTracking() {
        try {
            if (window.__rgcEmuAutoTrackingInstalled) return;
            window.__rgcEmuAutoTrackingInstalled = true;
        } catch (e) {}

        const pathname = String(window.location?.pathname || '').toLowerCase();
        const isEmulatorPage = pathname.includes('/games/') && pathname.endsWith('emulator.html');
        if (!isEmulatorPage) return;

        const attach = () => {
            const emu = window.EJS_emulator;
            if (!emu || typeof emu.on !== 'function') return false;
            if (emu.__rgcHooked) return true;
            emu.__rgcHooked = true;

            try {
                emu.on('start', () => trackGameLaunchFromEmulator({}));
            } catch (e) {}
            try {
                emu.on('ready', () => {
                    setTimeout(() => {
                        trackGameLaunchFromEmulator({});
                        startPlayTimeTracking();
                    }, 250);
                });
            } catch (e) {}

            try {
                emu.on('saveState', () => {
                    if (window.RGC && window.RGC.trackAchievementEvent) {
                        window.RGC.trackAchievementEvent('save_any');
                    }
                });
            } catch (e) {}

            var playStartTime = null;
            var playTimeCheckInterval = null;
            var playTimeFired = { 'play_1min': false, 'play_20min': false, 'play_1hr': false, 'play_2hr': false };
            function startPlayTimeTracking() {
                if (playStartTime) return;
                playStartTime = Date.now();
                if (playTimeCheckInterval) return;
                playTimeCheckInterval = setInterval(function() {
                    if (!playStartTime || document.hidden) return;
                    var elapsed = (Date.now() - playStartTime) / 1000;
                    if (elapsed >= 2 * 3600 && !playTimeFired.play_2hr) {
                        playTimeFired.play_2hr = true;
                        window.RGC && window.RGC.trackAchievementEvent && window.RGC.trackAchievementEvent('play_2hr');
                    }
                    if (elapsed >= 3600 && !playTimeFired.play_1hr) {
                        playTimeFired.play_1hr = true;
                        window.RGC && window.RGC.trackAchievementEvent && window.RGC.trackAchievementEvent('play_1hr');
                    }
                    if (elapsed >= 20 * 60 && !playTimeFired.play_20min) {
                        playTimeFired.play_20min = true;
                        window.RGC && window.RGC.trackAchievementEvent && window.RGC.trackAchievementEvent('play_20min');
                    }
                    if (elapsed >= 60 && !playTimeFired.play_1min) {
                        playTimeFired.play_1min = true;
                        window.RGC && window.RGC.trackAchievementEvent && window.RGC.trackAchievementEvent('play_1min');
                    }
                    if (playTimeFired.play_1min && playTimeFired.play_20min && playTimeFired.play_1hr && playTimeFired.play_2hr && playTimeCheckInterval) {
                        clearInterval(playTimeCheckInterval);
                        playTimeCheckInterval = null;
                    }
                }, 10000);
            }
            try {
                emu.on('start', startPlayTimeTracking);
            } catch (e) {}
            try {
                if (emu.started || (emu.gameManager && typeof emu.gameManager === 'object')) {
                    startPlayTimeTracking();
                }
            } catch (e) {}

            try {
                if (emu.started || (emu.gameManager && typeof emu.gameManager === 'object')) {
                    setTimeout(() => trackGameLaunchFromEmulator({}), 250);
                } else {
                    setTimeout(() => trackGameLaunchFromEmulator({}), 2500);
                }
            } catch (e) {}

            setTimeout(function() {
                try {
                    if (emu && (emu.started || (emu.gameManager && typeof emu.gameManager === 'object')) && !playStartTime) {
                        startPlayTimeTracking();
                    }
                } catch (err) {}
            }, 5000);

            return true;
        };

        const start = Date.now();
        const timeoutMs = 60000;
        const tick = () => {
            if (attach()) return;
            if (Date.now() - start > timeoutMs) return;
            setTimeout(tick, 250);
        };
        tick();
    }

    function fireSpecialEvent(eventType) {
        if (!eventType || triggeredSpecialEvents.has(eventType)) return;
        triggeredSpecialEvents.add(eventType);
        window.RGC?.trackAchievementEvent?.(eventType);
    }

    function isPortOrEmulatorPage(pathname) {
        const p = String(pathname || '').toLowerCase();
        // Порты
        if (p.includes('/ports/') || p.includes('/games/ports/')) return true;
        // Эмуляторы в разделах (на всякий случай, если подключат скрипт и там)
        if (p.includes('/games/') && p.includes('emulator.html')) return true;
        return false;
    }

    function detectQueryEvents(path, rom, game, search) {
        const normalizedPath = path.toLowerCase();
        const normalizedRom = rom || '';
        if (normalizedPath.includes('/games/megadrive/')) {
            fireSpecialEvent('sega');
            if (normalizedRom.includes('sonic the hedgehog') || normalizedRom.includes('sonic-the-hedgehog')) {
                fireSpecialEvent('sonic');
            }
        }
        if (normalizedPath.includes('/games/nestg/') && (normalizedRom.includes('battle city') || normalizedRom.includes('battlecity'))) {
            fireSpecialEvent('battlecity');
        }
        if (normalizedPath.includes('/games/snestg/') && normalizedRom.includes('donkey kong country')) {
            fireSpecialEvent('donkey_country');
        }
        if (normalizedPath.includes('/games/gbatg/') && normalizedRom.includes('wario land 4')) {
            fireSpecialEvent('wario');
        }
        if (normalizedPath.includes('/games/gbctg/') && normalizedRom.includes('tetris (world')) {
            fireSpecialEvent('tetris');
        }
        if (normalizedPath.includes('/games/psxtg/') && (game === 'tek3' || game === 'tekken3' || search.includes('tekken3'))) {
            fireSpecialEvent('tekken');
        }
        if (normalizedPath.includes('/games/3dotg/') && game === 'gex') {
            fireSpecialEvent('gex');
        }
        if (normalizedPath.includes('/games/j2metg/') && (search.includes('gdtr') || search.includes('gravitydef'))) {
            fireSpecialEvent('gravity');
        }
    }

    function detectPortPageEvents(path) {
        const normalizedPath = path.toLowerCase();
        // Для портов (кроме TrueDoom, там есть выбор игры) засчитываем запуск на старте страницы.
        if (normalizedPath.includes('/ports/truedoom/') || normalizedPath.includes('/games/ports/truedoom/')) {
            return;
        }
        const isPortPage = normalizedPath.includes('/ports/') || normalizedPath.includes('/games/ports/');
        if (!isPortPage) return;

        // общий запуск
        window.RGC?.trackGameLaunchFromEmulator?.({ core: 'port', gameUrl: normalizedPath, page: window.location?.href });

        if (normalizedPath.includes('/ports/dune2tg/') || normalizedPath.includes('/games/ports/dune2tg/')) {
            fireSpecialEvent('dune');
        } else if (normalizedPath.includes('/ports/duke3dtg/') || normalizedPath.includes('/games/ports/duke3dtg/')) {
            fireSpecialEvent('duke');
        } else if (normalizedPath.includes('/ports/quaketg/') || normalizedPath.includes('/games/ports/quaketg/')) {
            fireSpecialEvent('quake');
        } else if (normalizedPath.includes('/ports/heretichex/') || normalizedPath.includes('/games/ports/heretichex/')) {
            fireSpecialEvent('herexen');
        } else if (normalizedPath.includes('/ports/wolf3dtg/') || normalizedPath.includes('/games/ports/wolf3dtg/')) {
            fireSpecialEvent('wolf');
        }
    }

    function detectHrefEvents(href) {
        if (!href) return;
        const normalizedHref = href.toLowerCase();
        if (normalizedHref.includes('/games/megadrive/')) {
            fireSpecialEvent('sega');
            if (normalizedHref.includes('sonic the hedgehog') || normalizedHref.includes('sonic-the-hedgehog')) {
                fireSpecialEvent('sonic');
            }
        }
        if (normalizedHref.includes('/games/nestg/') && (normalizedHref.includes('battle city') || normalizedHref.includes('battlecity'))) {
            fireSpecialEvent('battlecity');
        }
        if (normalizedHref.includes('/games/snestg/') && normalizedHref.includes('donkey kong')) {
            fireSpecialEvent('donkey');
        }
        if (normalizedHref.includes('/games/gbatg/') && normalizedHref.includes('wario land 4')) {
            fireSpecialEvent('wario');
        }
        if (normalizedHref.includes('/games/gbctg/') && normalizedHref.includes('tetris (world')) {
            fireSpecialEvent('tetris');
        }
        if (normalizedHref.includes('/games/psxtg/') && (normalizedHref.includes('tek3') || normalizedHref.includes('tekken3'))) {
            fireSpecialEvent('tekken');
        }
        if (normalizedHref.includes('/games/3dotg/') && normalizedHref.includes('gex')) {
            fireSpecialEvent('gex');
        }
        if (normalizedHref.includes('/games/j2metg/') && (normalizedHref.includes('gdtr') || normalizedHref.includes('gravitydef'))) {
            fireSpecialEvent('gravity');
        }
    }

    function readJSON(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('Failed to parse storage key', key, error);
            localStorage.removeItem(key);
            return null;
        }
    }

    function persistJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to persist storage key', key, error);
        }
    }

    function readEventQueue() {
        return readJSON(getEventQueueKey()) || [];
    }

    function saveEventQueue(queue) {
        persistJSON(getEventQueueKey(), queue);
    }

    function queueEvent(eventType, initData) {
        if (!eventType || !initData) return;
        const queue = readEventQueue();
        queue.push({ event: eventType, initData, createdAt: Date.now() });
        if (queue.length > MAX_QUEUE_LENGTH) {
            queue.splice(0, queue.length - MAX_QUEUE_LENGTH);
        }
        saveEventQueue(queue);
    }

    const localStateCache = {};

    function emptyLocalState() {
        return {
            launch_count: 0,
            support_visited: false,
            news_visited: false,
            dune_launched: false,
            doom_launched: false,
            duke_launched: false,
            psx_launched: false,
            nes_launched: false,
            snes_launched: false,
            srq_launched: false,
            herexen_launched: false,
            wolf_launched: false,
            quake_launched: false,
            sega_launched: false,
            battlecity_launched: false,
            donkey_launched: false,
            donkey_country_launched: false,
            gravity_launched: false,
            sonic_launched: false,
            wario_launched: false,
            tetris_launched: false,
            tekken_launched: false,
            gex_launched: false,
            n64_launched: false,
            dreamcast_launched: false,
            c64_launched: false,
            sega32x_launched: false,
            virtualboy_launched: false,
            segamaster_launched: false,
            gamegear_launched: false,
            atarijaguar_launched: false,
            atari2600_launched: false,
            et_launched: false,
            virtua_racing_deluxe_launched: false,
            doszone_mobile_launched: false,
            retrohub_dendy_launched: false,
            retrohub_sega_launched: false,
            atari5600_launched: false,
            darkwing_duck_launched: false,
            harry_potter_launched: false,
            umk3_launched: false,
            hyperstone_heist_launched: false,
            fav_count: 0,
            konami_30lives_unlocked: false,
            author_name_unlocked: false,
            lobby_enter: false,
            lobby_create_server: false,
            lobby_join_game: false,
            zxspectrum_launched: false,
            nds_launched: false,
            random_refresh_count: 0,
            netplay_chipndale: false,
            yourmulator_launched: false,
            ps2web_visited: false,
            netplay_rocknroll: false,
            netplay_umk3_server: false,
            netplay_hyperstone_server: false,
            netplay_worms: false,
            netplay_sor2: false,
            play_1min: false,
            play_20min: false,
            play_1hr: false,
            play_2hr: false,
            save_any: false,
            achievement_timestamps: {}
        };
    }

    function readLocalState() {
        const key = getLocalStateKey();
        if (localStateCache[key]) return localStateCache[key];
        const stored = readJSON(key);
        const currentUser = getTelegramUserId();
        const validStored = stored && (!currentUser || stored.__owner_id === currentUser);
        const state = validStored ? stored : emptyLocalState();
        if (currentUser) state.__owner_id = currentUser;
        localStateCache[key] = state;
        return state;
    }

    function saveLocalState(state) {
        const key = getLocalStateKey();
        const currentUser = getTelegramUserId();
        const next = { ...state };
        if (currentUser) next.__owner_id = currentUser;
        localStateCache[key] = next;
        persistJSON(key, next);
    }

    function computeProgress(meta, state) {
        const type = meta.type;
        const normalizedState = state || {};
        if (type === 'launch') {
            return Math.min(normalizedState.launch_count || 0, meta.threshold);
        } else if (type === 'support') {
            return normalizedState.support_visited ? 1 : 0;
        } else if (type === 'news') {
            return normalizedState.news_visited ? 1 : 0;
        } else if (type === 'dune') {
            return normalizedState.dune_launched ? 1 : 0;
        } else if (type === 'doom') {
            return normalizedState.doom_launched ? 1 : 0;
        } else if (type === 'duke') {
            return normalizedState.duke_launched ? 1 : 0;
        } else if (type === 'psx') {
            return normalizedState.psx_launched ? 1 : 0;
        } else if (type === 'nes') {
            return normalizedState.nes_launched ? 1 : 0;
        } else if (type === 'snes') {
            return normalizedState.snes_launched ? 1 : 0;
        } else if (type === 'srq') {
            return normalizedState.srq_launched ? 1 : 0;
        } else if (type === 'herexen') {
            return normalizedState.herexen_launched ? 1 : 0;
        } else if (type === 'wolf') {
            return normalizedState.wolf_launched ? 1 : 0;
        } else if (type === 'quake') {
            return normalizedState.quake_launched ? 1 : 0;
        } else if (type === 'sega') {
            return normalizedState.sega_launched ? 1 : 0;
        } else if (type === 'battlecity') {
            return normalizedState.battlecity_launched ? 1 : 0;
        } else if (type === 'donkey') {
            return normalizedState.donkey_launched ? 1 : 0;
        } else if (type === 'donkey_country') {
            return normalizedState.donkey_country_launched ? 1 : 0;
        } else if (type === 'gravity') {
            return normalizedState.gravity_launched ? 1 : 0;
        } else if (type === 'sonic') {
            return normalizedState.sonic_launched ? 1 : 0;
        } else if (type === 'wario') {
            return normalizedState.wario_launched ? 1 : 0;
        } else if (type === 'tetris') {
            return normalizedState.tetris_launched ? 1 : 0;
        } else if (type === 'tekken') {
            return normalizedState.tekken_launched ? 1 : 0;
        } else if (type === 'gex') {
            return normalizedState.gex_launched ? 1 : 0;
        } else if (type === 'n64') {
            return normalizedState.n64_launched ? 1 : 0;
        } else if (type === 'dreamcast') {
            return normalizedState.dreamcast_launched ? 1 : 0;
        } else if (type === 'c64') {
            return normalizedState.c64_launched ? 1 : 0;
        } else if (type === 'sega32x') {
            return normalizedState.sega32x_launched ? 1 : 0;
        } else if (type === 'virtualboy') {
            return normalizedState.virtualboy_launched ? 1 : 0;
        } else if (type === 'segamaster') {
            return normalizedState.segamaster_launched ? 1 : 0;
        } else if (type === 'gamegear') {
            return normalizedState.gamegear_launched ? 1 : 0;
        } else if (type === 'atarijaguar') {
            return normalizedState.atarijaguar_launched ? 1 : 0;
        } else if (type === 'atari2600') {
            return normalizedState.atari2600_launched ? 1 : 0;
        } else if (type === 'et') {
            return normalizedState.et_launched ? 1 : 0;
        } else if (type === 'virtua_racing_deluxe') {
            return normalizedState.virtua_racing_deluxe_launched ? 1 : 0;
        } else if (type === 'doszone_mobile') {
            return normalizedState.doszone_mobile_launched ? 1 : 0;
        } else if (type === 'retrohub') {
            const a = normalizedState.retrohub_dendy_launched ? 1 : 0;
            const b = normalizedState.retrohub_sega_launched ? 1 : 0;
            return Math.min(a + b, meta.threshold);
        } else if (type === 'atari5600') {
            return normalizedState.atari5600_launched ? 1 : 0;
        } else if (type === 'darkwing_duck') {
            return normalizedState.darkwing_duck_launched ? 1 : 0;
        } else if (type === 'harry_potter') {
            return normalizedState.harry_potter_launched ? 1 : 0;
        } else if (type === 'umk3') {
            return normalizedState.umk3_launched ? 1 : 0;
        } else if (type === 'hyperstone_heist') {
            return normalizedState.hyperstone_heist_launched ? 1 : 0;
        } else if (type === 'fav_count') {
            return Math.min(normalizedState.fav_count || 0, meta.threshold);
        } else if (type === 'konami_30lives') {
            return normalizedState.konami_30lives_unlocked ? 1 : 0;
        } else if (type === 'author_name') {
            return normalizedState.author_name_unlocked ? 1 : 0;
        } else if (type === 'lobby_enter') {
            return normalizedState.lobby_enter ? 1 : 0;
        } else if (type === 'lobby_create_server') {
            return normalizedState.lobby_create_server ? 1 : 0;
        } else if (type === 'lobby_join_game') {
            return normalizedState.lobby_join_game ? 1 : 0;
        } else if (type === 'zxspectrum') {
            return normalizedState.zxspectrum_launched ? 1 : 0;
        } else if (type === 'nds') {
            return normalizedState.nds_launched ? 1 : 0;
        } else if (type === 'random_refresh_25') {
            return Math.min(normalizedState.random_refresh_count || 0, meta.threshold);
        } else if (type === 'netplay_chipndale') {
            return normalizedState.netplay_chipndale ? 1 : 0;
        } else if (type === 'yourmulator') {
            return normalizedState.yourmulator_launched ? 1 : 0;
        } else if (type === 'ps2web') {
            return normalizedState.ps2web_visited ? 1 : 0;
        } else if (type === 'netplay_rocknroll') {
            return normalizedState.netplay_rocknroll ? 1 : 0;
        } else if (type === 'netplay_umk3') {
            return normalizedState.netplay_umk3_server ? 1 : 0;
        } else if (type === 'netplay_hyperstone') {
            return normalizedState.netplay_hyperstone_server ? 1 : 0;
        } else if (type === 'netplay_worms') {
            return normalizedState.netplay_worms ? 1 : 0;
        } else if (type === 'netplay_sor2') {
            return normalizedState.netplay_sor2 ? 1 : 0;
        } else if (type === 'play_1min') {
            return normalizedState.play_1min ? 1 : 0;
        } else if (type === 'play_20min') {
            return normalizedState.play_20min ? 1 : 0;
        } else if (type === 'play_1hr') {
            return normalizedState.play_1hr ? 1 : 0;
        } else if (type === 'play_2hr') {
            return normalizedState.play_2hr ? 1 : 0;
        } else if (type === 'save_any') {
            return normalizedState.save_any ? 1 : 0;
        }
        return 0;
    }

    function markLocalAchievements(state) {
        state.achievement_timestamps = state.achievement_timestamps || {};
        ACHIEVEMENT_METADATA.forEach(meta => {
            const progress = computeProgress(meta, state);
            if (progress >= meta.threshold && !state.achievement_timestamps[meta.id]) {
                state.achievement_timestamps[meta.id] = new Date().toISOString();
                announceAchievement(meta.id);
            }
        });
    }

    function updateLocalState(eventType) {
        const state = readLocalState();
        let changed = false;
        switch (eventType) {
            case 'launch':
                state.launch_count = (state.launch_count || 0) + 1;
                changed = true;
                break;
            case 'support':
                if (!state.support_visited) {
                    state.support_visited = true;
                    changed = true;
                }
                break;
            case 'news':
                if (!state.news_visited) {
                    state.news_visited = true;
                    changed = true;
                }
                break;
            case 'dune':
                if (!state.dune_launched) {
                    state.dune_launched = true;
                    changed = true;
                }
                break;
            case 'doom':
                if (!state.doom_launched) {
                    state.doom_launched = true;
                    changed = true;
                }
                break;
            case 'duke':
                if (!state.duke_launched) {
                    state.duke_launched = true;
                    changed = true;
                }
                break;
            case 'psx':
                if (!state.psx_launched) {
                    state.psx_launched = true;
                    changed = true;
                }
                break;
            case 'nes':
                if (!state.nes_launched) {
                    state.nes_launched = true;
                    changed = true;
                }
                break;
            case 'snes':
                if (!state.snes_launched) {
                    state.snes_launched = true;
                    changed = true;
                }
                break;
            case 'srq':
                if (!state.srq_launched) {
                    state.srq_launched = true;
                    changed = true;
                }
                break;
            case 'herexen':
                if (!state.herexen_launched) {
                    state.herexen_launched = true;
                    changed = true;
                }
                break;
            case 'wolf':
                if (!state.wolf_launched) {
                    state.wolf_launched = true;
                    changed = true;
                }
                break;
            case 'quake':
                if (!state.quake_launched) {
                    state.quake_launched = true;
                    changed = true;
                }
                break;
            case 'sega':
                if (!state.sega_launched) {
                    state.sega_launched = true;
                    changed = true;
                }
                break;
            case 'battlecity':
                if (!state.battlecity_launched) {
                    state.battlecity_launched = true;
                    changed = true;
                }
                break;
            case 'donkey':
                if (!state.donkey_launched) {
                    state.donkey_launched = true;
                    changed = true;
                }
                break;
            case 'donkey_country':
                if (!state.donkey_country_launched) {
                    state.donkey_country_launched = true;
                    changed = true;
                }
                break;
            case 'gravity':
                if (!state.gravity_launched) {
                    state.gravity_launched = true;
                    changed = true;
                }
                break;
            case 'sonic':
                if (!state.sonic_launched) {
                    state.sonic_launched = true;
                    changed = true;
                }
                break;
            case 'wario':
                if (!state.wario_launched) {
                    state.wario_launched = true;
                    changed = true;
                }
                break;
            case 'tetris':
                if (!state.tetris_launched) {
                    state.tetris_launched = true;
                    changed = true;
                }
                break;
            case 'tekken':
                if (!state.tekken_launched) {
                    state.tekken_launched = true;
                    changed = true;
                }
                break;
            case 'gex':
                if (!state.gex_launched) {
                    state.gex_launched = true;
                    changed = true;
                }
                break;
            case 'n64':
                if (!state.n64_launched) {
                    state.n64_launched = true;
                    changed = true;
                }
                break;
            case 'dreamcast':
                if (!state.dreamcast_launched) {
                    state.dreamcast_launched = true;
                    changed = true;
                }
                break;
            case 'c64':
                if (!state.c64_launched) {
                    state.c64_launched = true;
                    changed = true;
                }
                break;
            case 'sega32x':
                if (!state.sega32x_launched) {
                    state.sega32x_launched = true;
                    changed = true;
                }
                break;
            case 'virtualboy':
                if (!state.virtualboy_launched) {
                    state.virtualboy_launched = true;
                    changed = true;
                }
                break;
            case 'segamaster':
                if (!state.segamaster_launched) {
                    state.segamaster_launched = true;
                    changed = true;
                }
                break;
            case 'gamegear':
                if (!state.gamegear_launched) {
                    state.gamegear_launched = true;
                    changed = true;
                }
                break;
            case 'atarijaguar':
                if (!state.atarijaguar_launched) {
                    state.atarijaguar_launched = true;
                    changed = true;
                }
                break;
            case 'atari2600':
                if (!state.atari2600_launched) {
                    state.atari2600_launched = true;
                    changed = true;
                }
                break;
            case 'et':
                if (!state.et_launched) {
                    state.et_launched = true;
                    changed = true;
                }
                break;
            case 'virtua_racing_deluxe':
                if (!state.virtua_racing_deluxe_launched) {
                    state.virtua_racing_deluxe_launched = true;
                    changed = true;
                }
                break;
            case 'doszone_mobile':
                if (!state.doszone_mobile_launched) {
                    state.doszone_mobile_launched = true;
                    changed = true;
                }
                break;
            case 'retrohub_dendy':
                if (!state.retrohub_dendy_launched) {
                    state.retrohub_dendy_launched = true;
                    changed = true;
                }
                break;
            case 'retrohub_sega':
                if (!state.retrohub_sega_launched) {
                    state.retrohub_sega_launched = true;
                    changed = true;
                }
                break;
            case 'atari5600':
                if (!state.atari5600_launched) {
                    state.atari5600_launched = true;
                    changed = true;
                }
                break;
            case 'darkwing_duck':
                if (!state.darkwing_duck_launched) {
                    state.darkwing_duck_launched = true;
                    changed = true;
                }
                break;
            case 'harry_potter':
                if (!state.harry_potter_launched) {
                    state.harry_potter_launched = true;
                    changed = true;
                }
                break;
            case 'umk3':
                if (!state.umk3_launched) {
                    state.umk3_launched = true;
                    changed = true;
                }
                break;
            case 'hyperstone_heist':
                if (!state.hyperstone_heist_launched) {
                    state.hyperstone_heist_launched = true;
                    changed = true;
                }
                break;
            case 'favorite':
                state.fav_count = (state.fav_count || 0) + 1;
                changed = true;
                break;
            case 'konami_30lives':
                if (!state.konami_30lives_unlocked) {
                    state.konami_30lives_unlocked = true;
                    changed = true;
                }
                break;
            case 'author_name':
                if (!state.author_name_unlocked) {
                    state.author_name_unlocked = true;
                    changed = true;
                }
                break;
            case 'lobby_enter':
                if (!state.lobby_enter) {
                    state.lobby_enter = true;
                    changed = true;
                }
                break;
            case 'lobby_create_server':
                if (!state.lobby_create_server) {
                    state.lobby_create_server = true;
                    changed = true;
                }
                break;
            case 'lobby_join_game':
                if (!state.lobby_join_game) {
                    state.lobby_join_game = true;
                    changed = true;
                }
                break;
            case 'zxspectrum':
                if (!state.zxspectrum_launched) {
                    state.zxspectrum_launched = true;
                    changed = true;
                }
                break;
            case 'nds':
                if (!state.nds_launched) {
                    state.nds_launched = true;
                    changed = true;
                }
                break;
            case 'random_refresh':
                state.random_refresh_count = (state.random_refresh_count || 0) + 1;
                changed = true;
                break;
            case 'netplay_chipndale':
                if (!state.netplay_chipndale) {
                    state.netplay_chipndale = true;
                    changed = true;
                }
                break;
            case 'yourmulator':
                if (!state.yourmulator_launched) {
                    state.yourmulator_launched = true;
                    changed = true;
                }
                break;
            case 'ps2web':
                if (!state.ps2web_visited) {
                    state.ps2web_visited = true;
                    changed = true;
                }
                break;
            case 'netplay_rocknroll':
                if (!state.netplay_rocknroll) {
                    state.netplay_rocknroll = true;
                    changed = true;
                }
                break;
            case 'netplay_umk3':
                if (!state.netplay_umk3_server) {
                    state.netplay_umk3_server = true;
                    changed = true;
                }
                break;
            case 'netplay_hyperstone':
                if (!state.netplay_hyperstone_server) {
                    state.netplay_hyperstone_server = true;
                    changed = true;
                }
                break;
            case 'netplay_worms':
                if (!state.netplay_worms) {
                    state.netplay_worms = true;
                    changed = true;
                }
                break;
            case 'netplay_sor2':
                if (!state.netplay_sor2) {
                    state.netplay_sor2 = true;
                    changed = true;
                }
                break;
            case 'play_1min':
                if (!state.play_1min) {
                    state.play_1min = true;
                    changed = true;
                }
                break;
            case 'play_20min':
                if (!state.play_20min) {
                    state.play_20min = true;
                    changed = true;
                }
                break;
            case 'play_1hr':
                if (!state.play_1hr) {
                    state.play_1hr = true;
                    changed = true;
                }
                break;
            case 'play_2hr':
                if (!state.play_2hr) {
                    state.play_2hr = true;
                    changed = true;
                }
                break;
            case 'save_any':
                if (!state.save_any) {
                    state.save_any = true;
                    changed = true;
                }
                break;
        }
        if (changed) {
            markLocalAchievements(state);
            saveLocalState(state);
        }
        return changed;
    }

    function buildLocalStates(state) {
        const local = state || readLocalState();
        return ACHIEVEMENT_METADATA.map(meta => {
            const progress = computeProgress(meta, local);
            const unlocked = progress >= meta.threshold;
            return {
                id: meta.id,
                title_ru: meta.title_ru,
                title_en: meta.title_en,
                description_ru: meta.description_ru,
                description_en: meta.description_en,
                progress,
                threshold: meta.threshold,
                unlocked,
                unlocked_at: unlocked ? (local.achievement_timestamps?.[meta.id] || new Date().toISOString()) : undefined,
                secret: !!meta.secret
            };
        });
    }

    function mergeAchievementStates(serverStates = [], localStates = []) {
        const map = new Map();
        serverStates.forEach(state => {
            map.set(state.id, { ...state });
        });
        localStates.forEach(local => {
            const existing = map.get(local.id);
            if (existing) {
                map.set(local.id, {
                    ...existing,
                    progress: Math.max(existing.progress || 0, local.progress || 0),
                    threshold: Math.max(existing.threshold || 0, local.threshold || 0),
                    unlocked: existing.unlocked || local.unlocked,
                    unlocked_at: existing.unlocked_at || local.unlocked_at
                });
            } else {
                map.set(local.id, local);
            }
        });
        return Array.from(map.values());
    }

    function mergeProfileWithLocal(profile = {}) {
        const local = readLocalState();
        const merged = {
            ...profile,
            launch_count: Math.max(profile.launch_count || 0, local.launch_count || 0),
            support_visited: profile.support_visited || local.support_visited,
            news_visited: profile.news_visited || local.news_visited,
            dune_launched: profile.dune_launched || local.dune_launched,
            doom_launched: profile.doom_launched || local.doom_launched,
            duke_launched: profile.duke_launched || local.duke_launched,
            psx_launched: profile.psx_launched || local.psx_launched,
            nes_launched: profile.nes_launched || local.nes_launched,
            snes_launched: profile.snes_launched || local.snes_launched,
            srq_launched: profile.srq_launched || local.srq_launched,
            herexen_launched: profile.herexen_launched || local.herexen_launched,
            wolf_launched: profile.wolf_launched || local.wolf_launched,
            quake_launched: profile.quake_launched || local.quake_launched,
            sega_launched: profile.sega_launched || local.sega_launched,
            battlecity_launched: profile.battlecity_launched || local.battlecity_launched,
            donkey_launched: profile.donkey_launched || local.donkey_launched,
            donkey_country_launched: profile.donkey_country_launched || local.donkey_country_launched,
            gravity_launched: profile.gravity_launched || local.gravity_launched,
            sonic_launched: profile.sonic_launched || local.sonic_launched,
            wario_launched: profile.wario_launched || local.wario_launched,
            tetris_launched: profile.tetris_launched || local.tetris_launched,
            tekken_launched: profile.tekken_launched || local.tekken_launched,
            gex_launched: profile.gex_launched || local.gex_launched,
            n64_launched: profile.n64_launched || local.n64_launched,
            dreamcast_launched: profile.dreamcast_launched || local.dreamcast_launched,
            c64_launched: profile.c64_launched || local.c64_launched,
            sega32x_launched: profile.sega32x_launched || local.sega32x_launched,
            virtualboy_launched: profile.virtualboy_launched || local.virtualboy_launched,
            segamaster_launched: profile.segamaster_launched || local.segamaster_launched,
            gamegear_launched: profile.gamegear_launched || local.gamegear_launched,
            atarijaguar_launched: profile.atarijaguar_launched || local.atarijaguar_launched,
            atari2600_launched: profile.atari2600_launched || local.atari2600_launched,
            et_launched: profile.et_launched || local.et_launched,
            virtua_racing_deluxe_launched: profile.virtua_racing_deluxe_launched || local.virtua_racing_deluxe_launched,
            doszone_mobile_launched: profile.doszone_mobile_launched || local.doszone_mobile_launched,
            retrohub_dendy_launched: profile.retrohub_dendy_launched || local.retrohub_dendy_launched,
            retrohub_sega_launched: profile.retrohub_sega_launched || local.retrohub_sega_launched,
            atari5600_launched: profile.atari5600_launched || local.atari5600_launched,
            darkwing_duck_launched: profile.darkwing_duck_launched || local.darkwing_duck_launched,
            harry_potter_launched: profile.harry_potter_launched || local.harry_potter_launched,
            umk3_launched: profile.umk3_launched || local.umk3_launched,
            hyperstone_heist_launched: profile.hyperstone_heist_launched || local.hyperstone_heist_launched,
            fav_count: Math.max(profile.fav_count || 0, local.fav_count || 0),
            konami_30lives_unlocked: profile.konami_30lives_unlocked || local.konami_30lives_unlocked,
            author_name_unlocked: profile.author_name_unlocked || local.author_name_unlocked,
            lobby_enter: profile.lobby_enter || local.lobby_enter,
            lobby_create_server: profile.lobby_create_server || local.lobby_create_server,
            lobby_join_game: profile.lobby_join_game || local.lobby_join_game,
            zxspectrum_launched: profile.zxspectrum_launched || local.zxspectrum_launched,
            nds_launched: profile.nds_launched || local.nds_launched,
            random_refresh_count: Math.max(profile.random_refresh_count || 0, local.random_refresh_count || 0),
            netplay_chipndale: profile.netplay_chipndale || local.netplay_chipndale,
            yourmulator_launched: profile.yourmulator_launched || local.yourmulator_launched,
            ps2web_visited: profile.ps2web_visited || local.ps2web_visited,
            netplay_rocknroll: profile.netplay_rocknroll || local.netplay_rocknroll,
            netplay_umk3_server: profile.netplay_umk3_server || local.netplay_umk3_server,
            netplay_hyperstone_server: profile.netplay_hyperstone_server || local.netplay_hyperstone_server,
            netplay_worms: profile.netplay_worms || local.netplay_worms,
            netplay_sor2: profile.netplay_sor2 || local.netplay_sor2,
            play_1min: profile.play_1min || local.play_1min,
            play_20min: profile.play_20min || local.play_20min,
            play_1hr: profile.play_1hr || local.play_1hr,
            play_2hr: profile.play_2hr || local.play_2hr,
            save_any: profile.save_any || local.save_any
        };
        merged.achievements = mergeAchievementStates(profile.achievements || [], buildLocalStates(local));
        return merged;
    }

    function profileMatchesCurrentUser(profile) {
        const currentUser = getTelegramUserId();
        if (!currentUser) return true;
        return String(profile?.id || '') === currentUser;
    }

    function readCachedProfile() {
        const key = getProfileStorageKey();
        const cached = readJSON(key);
        if (cached && profileMatchesCurrentUser(cached)) {
            return cached;
        }
        // Попытка мягкой миграции со старого ключа, если он привязан к текущему пользователю
        if (key !== PROFILE_STORAGE_KEY) {
            const legacy = readJSON(PROFILE_STORAGE_KEY);
            if (legacy && profileMatchesCurrentUser(legacy)) {
                persistJSON(key, legacy);
                return legacy;
            }
        }
        return null;
    }

    function persistMergedProfile(profile) {
        const base = profile || readCachedProfile() || {};
        const merged = mergeProfileWithLocal(base);
        try {
            localStorage.setItem(getProfileStorageKey(), JSON.stringify(merged));
        } catch (error) {
            console.warn('Profile cache failed', error);
        }
        setLatestProfile(merged);
        if (typeof window.RGC?.renderProfile === 'function') {
            window.RGC.renderProfile(merged);
        }
        const shown = readToastShown();
        (merged.achievements || []).forEach(state => {
            if (state.unlocked && state.id && !shown.has(state.id)) {
                shown.add(state.id);
                showAchievementToast(getMetaById(state.id) || state);
            }
        });
        persistToastShown(shown);
        return merged;
    }

    async function sendEventToServer(eventType, initData) {
        const response = await fetch(EVENT_ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ init_data: initData, event: eventType })
        });
        if (!response.ok) {
            throw new Error(`Achievement endpoint responded with ${response.status}`);
        }
        return response.json();
    }

    let flushInProgress = false;

    async function flushEventQueue() {
        if (flushInProgress || !isOnline()) return;
        const queue = readEventQueue();
        if (!queue.length) return;
        flushInProgress = true;
        try {
            const remaining = [];
            for (const item of queue) {
                try {
                    const payload = await sendEventToServer(item.event, item.initData);
                    if (payload?.profile) {
                        persistMergedProfile(payload.profile);
                    }
                } catch (error) {
                    console.warn('Queued achievement send failed', item.event, error);
                    remaining.push(item);
                }
            }
            if (remaining.length !== queue.length) {
                saveEventQueue(remaining);
            }
        } finally {
            flushInProgress = false;
        }
    }

    async function trackAchievementEvent(eventType) {
        const tg = window.Telegram?.WebApp;
        const initData = tg?.initData || window.currentInitData;

        const updated = updateLocalState(eventType);
        if (updated) {
            persistMergedProfile(getLatestProfile() || readCachedProfile());
        }

        if (!initData) return;

        if (!isOnline()) {
            queueEvent(eventType, initData);
            return;
        }

        await flushEventQueue();

        try {
            const payload = await sendEventToServer(eventType, initData);
            if (payload?.profile) {
                persistMergedProfile(payload.profile);
            }
        } catch (error) {
            console.warn('Achievement tracking failed, queuing event', eventType, error);
            queueEvent(eventType, initData);
        }
    }

    window.RGC = window.RGC || {};
    if (!window.RGC.trackAchievementEvent) {
        window.RGC.trackAchievementEvent = trackAchievementEvent;
    }
    if (!window.RGC.trackGameLaunchFromEmulator) {
        window.RGC.trackGameLaunchFromEmulator = trackGameLaunchFromEmulator;
    }
    window.RGC.mergeProfileWithLocal = mergeProfileWithLocal;
    window.RGC.persistMergedProfile = persistMergedProfile;
    window.RGC.readLocalAchievementState = readLocalState;
    if (!window.RGC.renderAchievements) {
        window.RGC.renderAchievements = renderAchievements;
    }

    window.addEventListener('online', flushEventQueue);
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            flushEventQueue();
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        applyTelegramLayoutFixes();
        if (readCachedProfile()) {
            const cached = readCachedProfile();
            const primed = mergeProfileWithLocal(cached);
            const shown = readToastShown();
            (primed.achievements || []).forEach(state => {
                if (state.unlocked && state.id) {
                    shown.add(state.id);
                }
            });
            persistToastShown(shown);
            persistMergedProfile(cached);
        }
        flushEventQueue();

        var pathnameForPage = (window.location.pathname || '').toLowerCase();
        if (pathnameForPage.indexOf('lobby') !== -1) {
            trackAchievementEvent('lobby_enter');
        }

        // На страницах эмулятора подключаемся к EJS_emulator и считаем запуск по факту старта.
        setupEmulatorAutoTracking();

        var emulatorPath = (window.location.pathname || '').toLowerCase();
        if (emulatorPath.indexOf('/games/') !== -1 && emulatorPath.indexOf('emulator.html') !== -1) {
            setTimeout(showPendingToastsFromStorage, 1500);
        }

        const path = window.location.pathname || '';
        detectPortPageEvents(path);

        document.addEventListener('click', function (event) {
            const launchButton = event.target.closest('.launch-button');
            if (!launchButton) return;

            const hrefAttr = launchButton.getAttribute('href') || '';
            const botId = launchButton.getAttribute('data-bot-id');
            const platform = launchButton.getAttribute('data-platform');
            const specialEvent = launchButton.getAttribute('data-event');

            const normalizedHref = String(hrefAttr).toLowerCase();

            // Внешние "запуски" (не EmulatorJS): DosZone Mobile и RetroHubGames
            if (botId === 'doszonebot' || normalizedHref.includes('dos.zone/mobile')) {
                window.RGC?.trackAchievementEvent?.('doszone_mobile');
            }
            if (botId === 'nestg' || normalizedHref.includes('t.me/dendyretrobot')) {
                window.RGC?.trackAchievementEvent?.('retrohub_dendy');
            }
            if (botId === 'megadrive' || normalizedHref.includes('t.me/segagamesbot')) {
                window.RGC?.trackAchievementEvent?.('retrohub_sega');
            }
            if (botId === 'yourmulator') {
                window.RGC?.trackAchievementEvent?.('yourmulator');
            }
            if (botId === 'ps2web') {
                window.RGC?.trackAchievementEvent?.('ps2web');
            }

            if (specialEvent === 'news') {
                window.RGC?.trackAchievementEvent?.('news');
            }

            // На мобилках/в Telegram WebApp часто уходим со страницы мгновенно,
            // и тост не успевает отрисоваться. Делаем маленькую задержку навигации.
            const tg = window.Telegram?.WebApp;
            const target = (launchButton.getAttribute('target') || '').toLowerCase();
            const isNav =
                hrefAttr &&
                !normalizedHref.startsWith('javascript:') &&
                normalizedHref !== '#' &&
                target !== '_blank';

            const isMobile = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '');
            if ((tg || isMobile) && isNav) {
                event.preventDefault();
                event.stopPropagation();
                setTimeout(() => {
                    // В Telegram WebApp openLink часто открывает внешне и может не принимать относительные URL.
                    // Для внутренних/относительных переходов используем обычную навигацию.
                    const isAbsoluteHttp = /^https?:\/\//i.test(hrefAttr);
                    const isSameOrigin = (() => {
                        try {
                            if (!isAbsoluteHttp) return true;
                            const u = new URL(hrefAttr, window.location.href);
                            return u.origin === window.location.origin;
                        } catch (e) {
                            return false;
                        }
                    })();

                    if (tg && typeof tg.openLink === 'function' && isAbsoluteHttp && !isSameOrigin) {
                        tg.openLink(hrefAttr);
                        return;
                    }
                    window.location.href = hrefAttr;
                }, 300);
            }
        });
    });
})();
