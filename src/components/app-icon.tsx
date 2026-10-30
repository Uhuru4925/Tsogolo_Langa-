import Image from "next/image";
import type { StaticImageData } from "next/image";
import type { IconName } from "@/lib/icon-names";
import accountIcon from "@/Icons/account_circle_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import achievementIcon from "@/Icons/rewarded_ads_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import addIcon from "@/Icons/add_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import alarmIcon from "@/Icons/alarm_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import balanceIcon from "@/Icons/balance_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import biologyIcon from "@/Icons/biotech_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import booksIcon from "@/Icons/auto_stories_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import chartIcon from "@/Icons/scatter_plot_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import closeIcon from "@/Icons/close_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import communicationIcon from "@/Icons/record_voice_over_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import computerIcon from "@/Icons/computer_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import constructionIcon from "@/Icons/construction_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import foodIcon from "@/Icons/outdoor_grill_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import leaderboardIcon from "@/Icons/leaderboard_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import libraryIcon from "@/Icons/library_books_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import linkIcon from "@/Icons/link_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import logoutIcon from "@/Icons/logout_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import personIcon from "@/Icons/person_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import personEditIcon from "@/Icons/person_edit_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import quizIcon from "@/Icons/quiz_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import schoolIcon from "@/Icons/school_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import scienceIcon from "@/Icons/science_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import searchIcon from "@/Icons/search_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import sortIcon from "@/Icons/sort_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import studyIcon from "@/Icons/local_library_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import targetIcon from "@/Icons/target_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";
import timeIcon from "@/Icons/more_time_24dp_E3E3E3_FILL1_wght400_GRAD0_opsz24.svg";

const ICONS: Record<IconName, StaticImageData> = {
  account: accountIcon,
  achievement: achievementIcon,
  add: addIcon,
  alarm: alarmIcon,
  balance: balanceIcon,
  biology: biologyIcon,
  books: booksIcon,
  chart: chartIcon,
  close: closeIcon,
  communication: communicationIcon,
  computer: computerIcon,
  construction: constructionIcon,
  food: foodIcon,
  leaderboard: leaderboardIcon,
  library: libraryIcon,
  link: linkIcon,
  logout: logoutIcon,
  person: personIcon,
  personEdit: personEditIcon,
  quiz: quizIcon,
  school: schoolIcon,
  science: scienceIcon,
  search: searchIcon,
  sort: sortIcon,
  study: studyIcon,
  target: targetIcon,
  time: timeIcon,
};

export function AppIcon({
  name,
  className = "h-6 w-6",
}: {
  name: IconName;
  className?: string;
}) {
  return <Image src={ICONS[name]} alt="" aria-hidden="true" className={className} />;
}
