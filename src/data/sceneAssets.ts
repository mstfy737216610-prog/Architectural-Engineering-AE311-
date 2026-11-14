import type { ProjectId } from './noesisProjectData';

import realP1Sc01 from '../assets/images/real_p1_sc01_doctor_papers_1794690230009.jpg';
import realP1Sc02 from '../assets/images/real_p1_sc02_red_pen_clock_1794690247738.jpg';
import realP1Sc03 from '../assets/images/real_p1_sc03_cloud_breach_1794690250036.jpg';
import realP1Sc04 from '../assets/images/real_p1_sc04_hardware_desk_1794690231930.jpg';
import realP1Sc05 from '../assets/images/real_p1_sc05_offline_dome_1794690251369.jpg';
import realP1Sc06 from '../assets/images/real_p1_sc06_doctor_login_1794690250442.jpg';
import realP1Sc07 from '../assets/images/real_p1_sc07_doctor_faceid_1794690251432.jpg';
import realP1Sc08 from '../assets/images/real_p1_sc08_doctor_scale_select_1794690252916.jpg';
import realP1Sc09 from '../assets/images/real_p1_sc09_noura_touch_1794690301351.jpg';
import realP1Sc10 from '../assets/images/real_p1_sc10_noura_emotion_1794690302225.jpg';
import realP1Sc11 from '../assets/images/real_p1_sc11_doctor_report_1794690302604.jpg';
import realP1Sc12 from '../assets/images/real_p1_sc12_clinic_finale_1794690304099.jpg';

import realP2Sc01 from '../assets/images/real_p2_sc01_rain_window_1794690317801.jpg';
import realP2Sc02 from '../assets/images/real_p2_sc02_frosted_door_1794690318439.jpg';
import realP2Sc03 from '../assets/images/real_p2_sc03_lamp_papers_1794690319140.jpg';
import realP2Sc04 from '../assets/images/real_p2_sc04_fiber_cloud_1794690320443.jpg';
import realP2Sc05 from '../assets/images/real_p2_sc05_dawn_led_1794690320564.jpg';
import realP2Sc06 from '../assets/images/real_p2_sc06_oak_hardware_1794690334589.jpg';
import realP2Sc07 from '../assets/images/real_p2_sc07_glass_sanctuary_1794690335982.jpg';
import realP2Sc08 from '../assets/images/real_p2_sc08_blinds_login_1794690335068.jpg';
import realP2Sc09 from '../assets/images/real_p2_sc09_doctor_sensor_1794690338283.jpg';
import realP2Sc10 from '../assets/images/real_p2_sc10_noura_enters_1794690337845.jpg';
import realP2Sc11 from '../assets/images/real_p2_sc11_noura_fingertips_1794690352351.jpg';
import realP2Sc12 from '../assets/images/real_p2_sc12_noura_speaks_hope_1794690353256.jpg';
import realP2Sc13 from '../assets/images/real_p2_sc13_shared_relief_1794690354837.jpg';
import realP2Sc14 from '../assets/images/real_p2_sc14_golden_sanctuary_1794690354939.jpg';

export const PROJECT_SCENE_VISUAL_ASSETS: Record<ProjectId, Record<number, string>> = {
  project1: {
    1: realP1Sc01,
    2: realP1Sc02,
    3: realP1Sc03,
    4: realP1Sc04,
    5: realP1Sc05,
    6: realP1Sc06,
    7: realP1Sc07,
    8: realP1Sc08,
    9: realP1Sc09,
    10: realP1Sc10,
    11: realP1Sc11,
    12: realP1Sc12,
  },
  project2: {
    1: realP2Sc01,
    2: realP2Sc02,
    3: realP2Sc03,
    4: realP2Sc04,
    5: realP2Sc05,
    6: realP2Sc06,
    7: realP2Sc07,
    8: realP2Sc08,
    9: realP2Sc09,
    10: realP2Sc10,
    11: realP2Sc11,
    12: realP2Sc12,
    13: realP2Sc13,
    14: realP2Sc14,
  },
};

export const SCENE_VISUAL_ASSETS: Record<number, string> = PROJECT_SCENE_VISUAL_ASSETS.project1;
