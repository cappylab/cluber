export const memberAnimalAvatars = [
  "/assets/game/avatars/01-bear.png",
  "/assets/game/avatars/02-rabbit.png",
  "/assets/game/avatars/03-cat.png",
  "/assets/game/avatars/04-puppy.png",
  "/assets/game/avatars/05-fox.png",
  "/assets/game/avatars/06-panda.png",
  "/assets/game/avatars/07-hamster.png",
  "/assets/game/avatars/08-penguin.png",
  "/assets/game/avatars/09-squirrel.png",
  "/assets/game/avatars/10-tiger-cub.png",
] as const;

export const decorProps = [
  "/assets/game/props/01-rocket.png",
  "/assets/game/props/02-megaphone.png",
  "/assets/game/props/03-boombox.png",
  "/assets/game/props/04-potted-plant.png",
  "/assets/game/props/05-guitar.png",
  "/assets/game/props/06-soccer-ball.png",
  "/assets/game/props/07-party-hat.png",
  "/assets/game/props/08-gift-box.png",
  "/assets/game/props/09-coin-stack.png",
  "/assets/game/props/10-balloons.png",
  "/assets/game/props/11-notice-board.png",
  "/assets/game/props/12-desk-lamp.png",
  "/assets/game/props/13-confetti-popper.png",
  "/assets/game/props/14-calendar-board.png",
  "/assets/game/props/15-star-cushion.png",
  "/assets/game/props/16-purple-podium.png",
] as const;

export const achievementBadges = [
  "/assets/game/badges/01-crown-medal.png",
  "/assets/game/badges/02-club-seal.png",
  "/assets/game/badges/03-star-certificate.png",
  "/assets/game/badges/04-participation-ribbon.png",
  "/assets/game/badges/05-top-contributor.png",
  "/assets/game/badges/06-paid-complete.png",
  "/assets/game/badges/07-monthly-goal.png",
  "/assets/game/badges/08-volunteer.png",
  "/assets/game/badges/09-attendance.png",
  "/assets/game/badges/10-team-leader.png",
  "/assets/game/badges/11-donation-coin.png",
  "/assets/game/badges/12-achievement-shield.png",
] as const;

export function assetBySeed<T extends readonly string[]>(items: T, seedText: string) {
  const seed = Array.from(seedText).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[seed % items.length];
}
