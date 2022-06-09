import constants from '../constants';
import config from '../config';

/**
 * @example
 * // return [['台北', '左營', '2022-06-01'], ['台北', '台中', '2022-06-02'], ...]
 * @returns {string[][]} Returns array of arrays of strings which contain every combinations of
 * startStation, destinationStation and date
 */
function getStationPairAndDateCombinations() {
  const { STATIONS: stations, TIMEZONE_OFFSET: tzOffset } = constants.OFFICIAL;
  const { crawlDaysAfterToday } = config.puppeteer;
  const date = new Date();
  const timezoneDiff = tzOffset * 60 + date.getTimezoneOffset();
  date.setTime(date.getTime() + timezoneDiff * 60 * 1000);

  const datesToCrawl = [date.toISOString().split('T')[0]];
  for (let i = 0; i < crawlDaysAfterToday; i += 1) {
    date.setDate(date.getDate() + 1);
    datesToCrawl.push(date.toISOString().split('T')[0]);
  }

  const allStationPairs = stations.flatMap((s1, i) =>
    stations.slice(i + 1).map((s2) => [s1, s2]),
  );

  const everyStationPairWithDate = allStationPairs
    .flatMap((s) => datesToCrawl.map((d) => [s, d]))
    .map((spwd) => [spwd[0][0], spwd[0][1], spwd[1]]);

  // array shuffle
  for (let i = everyStationPairWithDate.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [everyStationPairWithDate[i], everyStationPairWithDate[j]] = [
      everyStationPairWithDate[j],
      everyStationPairWithDate[i],
    ];
  }

  return everyStationPairWithDate;
}
export default getStationPairAndDateCombinations;
