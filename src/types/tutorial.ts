export interface TutorialState {
  completed: boolean;
  skipped: boolean;
  step: number;
}

export interface TutorialStepDefinition {
  id: string;
  title: string;
  body: string;
  hint?: string;
  highlight?: 'market' | 'travel' | 'stash' | 'supply' | 'missions' | 'heat';
}
