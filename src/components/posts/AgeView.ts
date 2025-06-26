import { Fabricate, FabricateComponent } from 'fabricate.js';
import Theme from '../../theme.ts';
import { AppState } from '../../types.ts';
import {
  getTimeAgoStr,
} from '../../utils.ts';

declare const fab: Fabricate<AppState>;

/**
 * PostAgeView component.
 *
 * @param {object} props - Component props.
 * @param {number} props.created - Created time.
 * @returns {FabricateComponent} PostAgeView component.
 */
const PostAgeView = ({ created }: { created: number }) => {
  let updateHandle: NodeJS.Timer;
  const ageText = fab('Text', {
    color: Theme.PostHeader.date,
    fontSize: '0.9rem',
    cursor: 'default',
    margin: '0px 5px',
  })
    .setText(getTimeAgoStr(created))
    .onCreate(() => {
      updateHandle = setInterval(() => {
        ageText.setText(getTimeAgoStr(created));
      }, 60 * 1000);
    })
    .onDestroy(() => clearInterval(updateHandle));

  return fab('Row', { alignItems: 'center' }, [ageText]);
};

export default PostAgeView;
