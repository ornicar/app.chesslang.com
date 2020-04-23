import 'babel-polyfill'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'mobx-react'

import { IntlProvider } from './locize/index'

import './firebaseInit'
import './main.less'
import './pages/utils.less'

import { App } from './app'
import { signupStore } from './stores/signup'
import { loginStore } from './stores/login'
import { userStore } from './stores/user'
import { preferencesStore } from './stores/preferences'
import { resetPasswordStore } from './stores/reset-password'
import { publicGamebaseStore } from './stores/public-gamebase'
import { privateGamebaseStore } from './stores/private-gamebase'
import { publicProblembaseStore } from './stores/public-problembase'
import { privateProblembaseStore } from './stores/private-problembase'
import { problembaseContentStore } from './stores/problembase-content'
import { gamebaseContentStore } from './stores/gamebase-content'
import { gameboxDatabaseStore } from './stores/gamebox-database'
import { gameboxDatabaseGameStore } from './stores/gamebox-database-game'
import { gameboxGamePreviewStore } from './stores/gamebox-game-preview'
import { exerciseStore } from './stores/exercise'
import { baseContentStore } from './stores/base-content'
import { studentsGroupsStore } from './stores/students-groups'
import { coachNetworkStore } from './stores/coach-network'
import { coachAssignmentStore } from './stores/coach-assignment'
import { studentAssignmentStore } from './stores/student-assignment'
import { mixpanelStore } from './stores/mixpanel'
import { problemSolveStore } from './stores/problem-solve'
import { academyStore } from './stores/academy'
import { paymentPlanStore } from './stores/payment-plan'
import { paymentSubscriptionStore } from './stores/payment-subscription'
import { coachAssignmentCompletionDetailsStore } from './stores/coach-assignment-completion-details'
import { engineStore } from './stores/engine'
import { practiceStore } from './stores/practice'
import { analyticsStore } from './stores/analytics'
import { invitationStore } from './stores/invitation-store'
import { syncedGameStore } from './stores/synced-game'
import { chatStore } from './stores/chat-store'
import { analyzerStore } from './stores/analyzer'
import { announcementStore } from './stores/announcements'
import { analysisBoardStore } from './stores/analysis-board-store'
import { coachTournamentStore } from './stores/coach-tournaments'
import { createTournamentFormStore } from './stores/create-tournament-form'
import { studentTournamentStore } from './stores/student-tournaments'
import { localeStore } from './stores/locale'
import { tournamentChatStore } from './stores/tournament-chat-store'
import { tournamentViewStore } from './stores/tournament-view'
import { liveGamePreviewStore } from './stores/live-game-preview'
import { liveGameStore } from './stores/live-game'
import { privateChatStore } from './stores/private-chat'
import { ratingSystemStore } from './stores/rating-system'
import { gameHistoryStore } from './stores/game-history-store'

const domContainer = document.getElementById('app')

const stores = {
  signupStore,
  loginStore,
  resetPasswordStore,
  userStore,
  preferencesStore,
  publicGamebaseStore,
  privateGamebaseStore,
  publicProblembaseStore,
  privateProblembaseStore,
  problembaseContentStore,
  gamebaseContentStore,
  gameboxDatabaseStore,
  gameboxDatabaseGameStore,
  gameboxGamePreviewStore,
  exerciseStore,
  baseContentStore,
  studentsGroupsStore,
  coachNetworkStore,
  coachAssignmentStore,
  studentAssignmentStore,
  mixpanelStore,
  problemSolveStore,
  academyStore,
  paymentPlanStore,
  paymentSubscriptionStore,
  coachAssignmentCompletionDetailsStore,
  engineStore,
  practiceStore,
  analyticsStore,
  invitationStore,
  syncedGameStore,
  chatStore,
  analyzerStore,
  announcementStore,
  analysisBoardStore,
  coachTournamentStore,
  createTournamentFormStore,
  studentTournamentStore,
  localeStore,
  tournamentChatStore,
  tournamentViewStore,
  liveGamePreviewStore,
  liveGameStore,
  privateChatStore,
  ratingSystemStore,
  gameHistoryStore
}

ReactDOM.render(
  <Provider {...stores}>
    <IntlProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </IntlProvider>
  </Provider>,
  domContainer
)
