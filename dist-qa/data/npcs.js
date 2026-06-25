"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NPC_MAP = exports.NPCS = void 0;
exports.NPCS = [
    {
        id: 'razor',
        name: 'Razor',
        type: 'rival',
        baseAttitude: -30,
        dialogueLines: {
            lowRep: [
                'Fresh meat. You got three seconds to explain yourself.',
                'Nobody on this block knows your name. That makes you disposable.',
            ],
            highRep: [
                'I know who you are. This block has rules — even for legends.',
                'Your rep precedes you. Doesn\'t mean I owe you anything.',
            ],
            highHeat: [
                'Cops are crawling everywhere. Bad time to start trouble.',
                'You reek of heat. Stay away from my corners.',
            ],
            highDebt: [
                'Heard you\'re bleeding cash. Desperate dealers make mistakes.',
                'Loan sharks circling? I might take a piece myself.',
            ],
            friendly: [
                'We can do business — just stay on your side of the line.',
                'You play fair, I play fair. Simple.',
            ],
            hostile: [
                'Wrong neighborhood, wrong day.',
                'I\'ve been waiting to collect on your attitude.',
            ],
        },
    },
    {
        id: 'whisper',
        name: 'Whisper',
        type: 'informant',
        baseAttitude: 10,
        dialogueLines: {
            lowRep: [
                'Information costs. Trust costs more. You\'re short on both.',
                'I don\'t talk to nobodies unless they pay upfront.',
            ],
            highRep: [
                'Your name opens doors. I can open a few more — for a price.',
                'People talk about you. I listen better than most.',
            ],
            highHeat: [
                'Too hot for street gossip. Meet me somewhere quiet.',
                'Wardens are listening. Keep your voice down.',
            ],
            highDebt: [
                'Debt makes people talk. I hope you\'re not planning to sell me out.',
                'Broke and desperate? That\'s when informants disappear.',
            ],
            friendly: [
                'For you? I might throw in a bonus detail.',
                'We have history. Good history.',
            ],
            hostile: [
                'You burned me before. Why should I help now?',
                'Last time you ignored my tip. Pay double or walk.',
            ],
        },
    },
    {
        id: 'mama_silk',
        name: 'Mama Silk',
        type: 'supplier',
        baseAttitude: 20,
        dialogueLines: {
            lowRep: [
                'Cash upfront. No credit. No exceptions.',
                'I don\'t know you. That\'s a problem for both of us.',
            ],
            highRep: [
                'Word is you move product fast. I like fast.',
                'Regulars get discounts. You\'re almost regular.',
            ],
            highHeat: [
                'My shipment can\'t sit long with heat like yours.',
                'Move quick or the price goes up.',
            ],
            highDebt: [
                'I smell desperation. Desperate buyers haggle too much.',
                'No layaway. Pay now or leave.',
            ],
            friendly: [
                'Special batch just for you. Don\'t waste it.',
                'You always pay on time. That counts for something.',
            ],
            hostile: [
                'You stiffed me once. Second chance isn\'t free.',
                'Prices just doubled. Take it or leave.',
            ],
        },
    },
    {
        id: 'bruno',
        name: 'Bruno',
        type: 'debt_collector',
        baseAttitude: -50,
        dialogueLines: {
            lowRep: [
                'Nobody vouches for you. That makes collection easy.',
                'Your rep is trash. Pay up before it gets worse.',
            ],
            highRep: [
                'Even big names owe. Especially big names.',
                'Respect doesn\'t pay my boss. Cash does.',
            ],
            highHeat: [
                'Cops everywhere — good. Nowhere for you to run.',
                'Heat on the street, heat on your ledger.',
            ],
            highDebt: [
                'This number keeps growing. My patience doesn\'t.',
                'Interest is a beautiful thing. For me.',
            ],
            friendly: [
                'You\'ve paid before. Maybe we can work something out.',
                'Boss likes reliable debtors. Be reliable.',
            ],
            hostile: [
                'Last warning was your last warning.',
                'Break a finger or break the bank. Your choice.',
            ],
        },
    },
    {
        id: 'chip',
        name: 'Chip',
        type: 'street_buyer',
        baseAttitude: 0,
        dialogueLines: {
            lowRep: [
                'Who sent you? I don\'t buy from strangers.',
                'Prove you\'re legit or get lost.',
            ],
            highRep: [
                'I\'ve heard of you. Got a premium buyer lined up.',
                'Your product moves clean. I want in.',
            ],
            highHeat: [
                'Quick deal — cops are close. Premium for speed.',
                'In and out. No names.',
            ],
            highDebt: [
                'Need cash fast? I might overpay. Might.',
                'Desperate sellers take bad deals. Lucky me.',
            ],
            friendly: [
                'Always a pleasure. Got a big order today.',
                'You deliver, I deliver. Let\'s deal.',
            ],
            hostile: [
                'Last batch was weak. Price reflects that.',
                'You wasted my time before. Make it up.',
            ],
        },
    },
    {
        id: 'vance',
        name: 'Officer Vance',
        type: 'corrupt_cop',
        baseAttitude: -20,
        dialogueLines: {
            lowRep: [
                'Street trash. Empty your pockets.',
                'No ID, no alibi, no luck.',
            ],
            highRep: [
                'Big fish in a small pond. Pond\'s mine today.',
                'Reputation won\'t fit in my report.',
            ],
            highHeat: [
                'We\'ve got your block staked out. You fit a profile.',
                'Heat like yours draws uniforms. I\'m first in line.',
            ],
            highDebt: [
                'Financial distress makes people sloppy. You look sloppy.',
                'Debts, deals, dirt — I collect it all.',
            ],
            friendly: [
                'You\'ve been useful before. Maybe today\'s easy.',
                'A little cooperation goes a long way.',
            ],
            hostile: [
                'Your bribes are late. So am I — to help you.',
                'I remember every time you ran.',
            ],
        },
    },
];
exports.NPC_MAP = Object.fromEntries(exports.NPCS.map((n) => [n.id, n]));
