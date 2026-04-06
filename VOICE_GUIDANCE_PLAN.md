# Voice Guidance Enhancement Plan

**Objective:** Enhance the existing voice guidance functionality to make the application more accessible, especially for users with visual impairments.

## 1. Current Implementation

The application currently has a `speak` function in `App.jsx` that uses the browser's `SpeechSynthesis` API. It is used to read out the analysis result after a message has been submitted.

## 2. Proposed Enhancements

### 2.1. Global Toggle for Voice Guidance

A global toggle switch will be added to the "Preferences" section in `AccountProfile.jsx` to allow users to enable or disable voice guidance across the entire application.

*   **Implementation:**
    *   A new custom hook, `useVoiceGuidance`, will be created to manage the state of the voice guidance preference (enabled/disabled). The state will be persisted in `localStorage`.
    *   The `useVoiceGuidance` hook will expose the current state and a function to toggle it.
    *   The `App.jsx` component will use this hook to get the current state and pass the toggle function to `AccountProfile.jsx`.
    *   The `speak` function will be modified to only speak if voice guidance is enabled.

### 2.2. Extended Coverage

The voice guidance will be extended to cover more parts of the application:

*   **Page Navigation:** When the user switches to a new tab (e.g., "Académie", "Ressources"), the title of the tab will be read out.
*   **Instructions:** On the "Analyser votre message" page, the main instructions will be read out when the page loads.
*   **Quiz Module:**
    *   When a quiz starts, the quiz title and the first question will be read out.
    *   When the user navigates to the next question, the new question will be read out.
    *   The user should have an option to have the multiple-choice answers read out to them.

## 3. Action Plan

1.  **Create `useVoiceGuidance` hook:**
    *   Create `frontend/src/hooks/useVoiceGuidance.js`.
    *   Create `frontend/src/hooks/useVoiceGuidance.test.js`.
2.  **Integrate the hook and toggle:**
    *   Modify `App.jsx` to use the `useVoiceGuidance` hook.
    *   Modify `AccountProfile.jsx` to include the toggle switch.
3.  **Extend `speak` function:**
    *   Modify the `speak` function in `App.jsx` to respect the user's preference.
4.  **Implement extended coverage:**
    *   Add `speak` calls for tab navigation.
    *   Add `speak` calls for instructions on the analysis page.
    *   Investigate and implement voice guidance in the `QuizAcademie` and `QuizModule` components.
