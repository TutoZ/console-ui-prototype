import React from 'react';
import { createRoot } from 'react-dom/client';
import { SaveCandidatePreview } from './SaveCandidatePreview';
import '../index.css';
import { SkillConfirmPreview } from './SkillConfirmPreview';
createRoot(document.getElementById('root')!).render(new URLSearchParams(location.search).get("case") === "skill-confirm" ? <SkillConfirmPreview /> : <SaveCandidatePreview />);
