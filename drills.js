// Drill library. Diagram coordinates: area is 30 wide (x) by 40 long (y), in yards.
// Top goal is attacked first. Player types: blue, red, gk, coach. Arrow kinds: pass, run, dribble.
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
    equipment: ['2 goals', '2 goalkeepers (or a coach in one goal)', '10+ balls with the coach', '5+ balls in the first goal for the keeper', 'Bibs in 2 colours', '4 cones for the corners', '2 cones for the start lines'],
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
    phases: [
      {
        name: 'Phase 1 · Cross & finish',
        steps: [
          'B1 passes to the coach and runs onto the return.',
          'The coach sets the ball back for a first-time cross.',
          'B2 and both reds race into the box. B2 tries to score; the reds defend.',
        ],
        diagram: {
          players: [
            { t: 'gk', l: 'GK', x: 15, y: 1.3 }, { t: 'gk', l: 'GK', x: 15, y: 38.7 },
            { t: 'coach', l: 'C', x: 2.2, y: 9.5 },
            { t: 'blue', l: 'B1', x: 1.5, y: 21, ball: true }, { t: 'red', l: 'R1', x: 4.3, y: 21 },
            { t: 'blue', l: 'B2', x: 1.5, y: 24 }, { t: 'red', l: 'R2', x: 4.3, y: 24 },
            { t: 'blue', l: '', x: 1.5, y: 27, wait: true }, { t: 'red', l: '', x: 4.3, y: 27, wait: true },
            { t: 'blue', l: '', x: 1.5, y: 29.6, wait: true }, { t: 'red', l: '', x: 4.3, y: 29.6, wait: true },
          ],
          arrows: [
            { k: 'pass', p: [[1.7, 19.8], [2.2, 10.9]], n: '1' },
            { k: 'run', p: [[2.4, 19.9], [4.6, 12.6]] },
            { k: 'pass', p: [[3, 10.3], [4.8, 11.7]], n: '2' },
            { k: 'pass', p: [[5.6, 11.6], [14.2, 4.6]], n: '3' },
            { k: 'run', p: [[2.4, 23.5], [12.6, 5.6]] },
            { k: 'run', p: [[5.2, 20.2], [15.6, 7.2]] },
            { k: 'run', p: [[5.3, 23.2], [18.4, 5.4]] },
          ],
          notes: [{ x: 7.5, y: 31.5, t: 'Next group waits' }],
        },
      },
      {
        name: 'Phase 2 · 2v2 counter',
        steps: [
          'As soon as the chance ends (goal, save, block or out), the first keeper plays out to a red.',
          'The reds attack the far goal. The crosser is still out wide, so it’s 2v1 until they recover.',
          'The rep ends with a goal, save or ball out of play. The next four go straight away.',
        ],
        diagram: {
          players: [
            { t: 'gk', l: 'GK', x: 15, y: 1.3, ball: true }, { t: 'gk', l: 'GK', x: 15, y: 38.7 },
            { t: 'coach', l: 'C', x: 2.2, y: 9.5 },
            { t: 'blue', l: 'B1', x: 4.8, y: 12 }, { t: 'blue', l: 'B2', x: 13, y: 6 },
            { t: 'red', l: 'R1', x: 16, y: 8 }, { t: 'red', l: 'R2', x: 22, y: 10.5 },
            { t: 'blue', l: '', x: 1.5, y: 27, wait: true }, { t: 'red', l: '', x: 4.3, y: 27, wait: true },
          ],
          arrows: [
            { k: 'pass', p: [[16, 2.3], [21.3, 9.4]], n: '1' },
            { k: 'dribble', p: [[22, 11.8], [19.5, 25]] },
            { k: 'run', p: [[16, 9.3], [12, 27]] },
            { k: 'run', p: [[13.4, 7.3], [16.4, 21]] },
            { k: 'run', p: [[5.4, 13.3], [10.5, 30]] },
            { k: 'pass', p: [[11.8, 28.4], [14.6, 37.2]], n: '2' },
          ],
          notes: [{ x: 1, y: 33.5, t: 'B1 sprints back' }, { x: 20, y: 18, t: '2v1!' }],
        },
      },
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
