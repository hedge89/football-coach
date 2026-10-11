// Drill library.
// Diagram area is 30 wide (x) by 40 long (y) in yards. The top goal is attacked first.
// people: id -> { t: blue|red|gk|coach, l: label, wait: faded waiting player }
// setup: still picture of starting positions, kit and labels.
// anim: start positions, who has the ball, then steps. Each step can move people (moves),
//   send the ball to a person id or a point (ball), and starts the ball late with ballAt (0-1).
window.DRILLS = [
  {
    id: 'cross-2v2-transition',
    name: 'Cross & Finish into 2v2 Counter',
    category: 'Transition',
    intensity: 'High',
    minutes: 15,
    players: '4 per rep (2 v 2) + 2 keepers + coach. Best with 8–12 so groups rotate.',
    area: 'About 40 × 30 yards, a goal at each end',
    source: { title: 'High-Intensity Transition Drills for Pre-Season', channel: 'Modern Soccer Coach', url: 'https://youtu.be/UUXz-Nqa6_Q?t=199', at: '3:19' },
    summary: 'Blues attack a first-time cross at one goal. The moment that chance ends, the keeper releases the reds to counter 2v2 at the other end. The crosser is still out wide, so it starts as a 2v1.',
    why: 'Two different pictures in one rep: a cross and finish, then a fast central counter. Players have to switch from attacking to defending (and back) instantly.',
    equipment: ['2 goals', '2 goalkeepers (or a coach in one goal)', '10+ balls with the coach', '5+ balls in the first goal for the keeper', 'Bibs: blue and red', '4 cones for the corners', '2 cones for the start lines'],
    setup: [
      'Mark an area about 40 yards long and 30 wide with a goal and keeper at each end.',
      'Put the start cones on one touchline, just in front of halfway.',
      'Blues line up on the outside (nearest the touchline). Reds line up just inside them.',
      'The coach stands wide near the first goal, about level with the edge of the box, with the balls.',
      'Leave spare balls in the first goal so the keeper can restart straight away.',
    ],
    roles: [
      { t: 'blue', l: 'B1', name: 'Crosser', job: 'Starts with the ball. Passes to the coach, then crosses first time.' },
      { t: 'blue', l: 'B2', name: 'Runner', job: 'Races into the box to finish the cross.' },
      { t: 'red', l: 'R', name: 'Red pair', job: 'Defend the cross, then counter-attack the far goal.' },
      { t: 'gk', l: 'GK', name: 'Keepers', job: 'First keeper saves, then releases a red fast. Second keeper faces the counter.' },
      { t: 'coach', l: 'C', name: 'Coach', job: 'Sets the ball back for the first-time cross.' },
    ],
    people: {
      GKA: { t: 'gk', l: 'GK' }, GKB: { t: 'gk', l: 'GK' }, C: { t: 'coach', l: 'C' },
      B1: { t: 'blue', l: 'B1' }, B2: { t: 'blue', l: 'B2' }, R1: { t: 'red', l: 'R1' }, R2: { t: 'red', l: 'R2' },
      W1: { t: 'blue', l: '', wait: true }, W2: { t: 'red', l: '', wait: true }, W3: { t: 'blue', l: '', wait: true }, W4: { t: 'red', l: '', wait: true },
    },
    start: {
      GKA: [15, 1.3], GKB: [15, 38.7], C: [2.2, 9.5],
      B1: [1.5, 21], R1: [4.3, 21], B2: [1.5, 24], R2: [4.3, 24],
      W1: [1.5, 27], W2: [4.3, 27], W3: [1.5, 29.6], W4: [4.3, 29.6],
    },
    layout: {
      cones: [[0.2, 19.6], [3.4, 19.6]],
      balls: [[0.9, 7.6, 5], [17.6, -0.4, 3]],
      callouts: [
        { to: [3.4, 19.4], at: [9, 16.2], text: 'Start cones' },
        { to: [4.6, 22.5], at: [9, 22.6], text: 'Blues outside, reds inside' },
        { to: [5, 28.3], at: [9, 29.2], text: 'Next group waits' },
        { to: [2.6, 8.4], at: [8.5, 10.6], text: 'Coach + ball supply' },
        { to: [18.6, 0.2], at: [20.6, 4.6], text: 'Spare balls' },
        { to: [16.3, 38.4], at: [19.3, 34.6], text: 'Keeper in each goal' },
      ],
    },
    anim: {
      ball: 'B1',
      steps: [
        { phase: 1, text: 'B1 passes into the coach.', dur: 1.1, ball: 'C', moves: { B1: [2.4, 17] } },
        { phase: 1, text: 'B1 runs on. The coach sets the ball back into their path.', dur: 1.4, ball: 'B1', ballAt: .35,
          moves: { B1: [4.6, 12.6], B2: [3.5, 20.5], R1: [6, 18.5], R2: [6.5, 21.5] } },
        { phase: 1, text: 'First-time cross. B2 and both reds race into the box.', dur: 1.5, ball: [14, 5.2], ballAt: .15,
          moves: { B2: [13.2, 5.6], R1: [15.6, 7.2], R2: [18.2, 5.6] } },
        { phase: 1, text: 'B2 attacks the cross and shoots. The keeper saves.', dur: .9, ball: 'GKA', ballAt: .2, moves: { B2: [13.8, 4.6] } },
        { phase: 2, text: 'Straight away the keeper plays out to a red.', dur: 1.3, ball: 'R2', ballAt: .25,
          moves: { R2: [22, 10.5], R1: [16.5, 9.5] } },
        { phase: 2, text: 'Reds counter fast. The crosser is still out wide, so it’s 2v1.', dur: 2.2,
          moves: { R2: [20.5, 23], R1: [13, 23], B2: [17, 24.5], B1: [7, 21] } },
        { phase: 2, text: 'R2 draws the defender, then slips R1 in.', dur: 1.3, ball: 'R1', ballAt: .45,
          moves: { R2: [19.5, 28], B2: [18, 29], R1: [12.5, 30.5], B1: [9, 27] } },
        { phase: 2, text: 'R1 finishes before the crosser gets back.', dur: .9, ball: [13.6, 40.4], ballAt: .1, moves: { B1: [10, 29.5] } },
        { phase: 2, text: 'Next four go straight away. Swap colours every few reps.', dur: 1.2, moves: {} },
      ],
    },
    phases: [
      { name: 'Phase 1 · Cross & finish', steps: [
        'B1 passes to the coach and runs onto the return.',
        'The coach sets the ball back for a first-time cross.',
        'B2 and both reds race into the box. B2 tries to score; the reds defend.',
      ] },
      { name: 'Phase 2 · 2v2 counter', steps: [
        'As soon as the chance ends (goal, save, block or out), the first keeper plays out to a red.',
        'The reds attack the far goal. The crosser is still out wide, so it’s 2v1 until they recover.',
        'The rep ends with a goal, save or ball out of play. The next four go straight away.',
      ] },
    ],
    rotation: 'Swap colours every few reps so everyone gets to cross, run and counter. Play in 3-minute blocks with a short rest.',
    coaching: [
      { who: 'Crosser (B1)', points: ['Cross first time. Don’t take a touch.', 'Aim for the gap between the keeper and the defenders, around the penalty spot to the six-yard box.'] },
      { who: 'Runner (B2)', points: ['Win the race. Get across the front of your defender.', 'Attack the near post or arrive late at the back post. Don’t stand still waiting for it.'] },
      { who: 'Reds defending the cross', points: ['Stay goal-side and see the ball and the runner at the same time.', 'Clear it high, wide and far.'] },
      { who: 'Reds on the counter', points: ['Look forward the moment you get the ball.', 'Go quickly to use the 2v1 before the crosser gets back.', 'Run at the defender to commit them, then pass at the right time.'] },
      { who: 'Blues recovering', points: ['Crosser: sprint back on the inside line towards your goal, not towards the ball.', 'Last defender: slow them down. Don’t dive in. Show them wide and wait for help.'] },
      { who: 'Keepers', points: ['Restart fast and accurately into the red’s path.'] },
    ],
    fromVideo: [
      'The blue outside player starts it with a ball to a coach, who sets it for a first-time cross. The other three get in the box.',
      'Immediately after that chance, the goalkeeper plays a ball to a red player and it’s a 2v2 the other way.',
      'If they play quickly and effectively, they can take advantage of the 2v1 before the crossing player recovers.',
    ],
    progressions: [
      'If the blues win it back during the counter, let them attack the first goal again.',
      'Limit the reds to 8 seconds to score on the counter.',
      'Easier: let the coach throw or roll the cross in for younger players.',
    ],
    note: 'The video shows the setup but not the area size, timings or most coaching points. Those are suggestions to adjust for your team.',
  },
];
