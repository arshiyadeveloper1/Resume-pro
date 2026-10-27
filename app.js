/**
 * RESUME PRO — Interactive Engine
 * Modeled after website Add interaction patterns:
 * - Vertical Stepper Navigation (Step 01: RESUME BUILDER <-> Step 02: 1-CLICK APPLY)
 * - Synchronized Left Content Pane & Right 3D Stage Views
 * - Interactive ATS Score Counter, AI Document Laser Scan
 * - Interactive Job Selection, Tab Toggling, and 1-Click Apply Flight Animation
 */

(function () {
  'use strict';

  // State
  let currentStep = 1;
  const totalSteps = 2;

  // Stepper Elements
  const stepNodes = [
    document.getElementById('step-node-1'),
    document.getElementById('step-node-2')
  ];
  const stepCounterDisplay = document.getElementById('stepCounterDisplay');

  // Left Panes
  const leftPanes = [
    document.getElementById('leftPaneStep1'),
    document.getElementById('leftPaneStep2')
  ];

  // Stage Views
  const stageViews = [
    document.getElementById('stageViewStep1'),
    document.getElementById('stageViewStep2')
  ];

  // Slide 01 Elements
  const atsRingFill = document.getElementById('atsRingFill');
  const atsScoreVal = document.getElementById('atsScoreVal');
  const atsStatusBadge = document.getElementById('atsStatusBadge');
  const atsCheckRows = document.querySelectorAll('#atsChecklist .check-row');
  const dockBtns = document.querySelectorAll('#resumeToolDock .dock-btn');
  const btnEditAi = document.getElementById('btnEditAi');
  const scanLaser = document.getElementById('scanLaser');

  // Slide 01 Animation Loop State
  let dockAutoIdx = 0;
  let dockTimer = null;
  let scoreLoopRaf = null;
  let scoreLoopTimeout = null;
  let isAiOptimizing = false;
  const CIRCUMFERENCE = 263.89; // 2 * PI * 42

  // Slide 02 Elements
  const jobRows = document.querySelectorAll('.job-row');
  const tailoredHeadline = document.getElementById('tailoredHeadline');
  const checkRoleResumeText = document.getElementById('checkRoleResumeText');
  const badgeSmartMatch = document.getElementById('badgeSmartMatch');
  const btnApplyNow = document.getElementById('btnApplyNow');
  const btnApplyNowText = document.getElementById('btnApplyNowText');
  const airplaneGlyph = document.getElementById('airplaneGlyph');
  const subTabBtns = document.querySelectorAll('.sub-tab-btn');

  // Slide 02 Animation Loop State
  let jobAutoIdx = 0;
  let jobSwitchTimer = null;
  let isJobManualPaused = false;
  let resumeJobTimer = null;

  // Clean Toast
  const cleanToast = document.getElementById('cleanToast');
  const cleanToastText = document.getElementById('cleanToastText');
  let toastTimer = null;

  function showToast(msg) {
    if (!cleanToast || !cleanToastText) return;
    cleanToastText.textContent = msg;
    cleanToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      cleanToast.classList.remove('show');
    }, 3200);
  }

  // =========================================================================
  // STEPPER SWITCHING LOGIC (Synchronized Transitions)
  // =========================================================================

  function goToStep(stepIndex) {
    currentStep = stepIndex;

    // Update Stepper Nodes
    stepNodes.forEach((node, idx) => {
      if (!node) return;
      const isTarget = (idx + 1) === currentStep;
      node.classList.toggle('active', isTarget);

      const ring = node.querySelector('.node-ring');
      const dot = node.querySelector('.node-dot');
      const halo = node.querySelector('.node-glow-halo');

      if (ring && dot) {
        if (isTarget) {
          ring.classList.remove('idle-ring');
          dot.classList.remove('idle-dot');
          if (halo) halo.style.display = 'block';
        } else {
          ring.classList.add('idle-ring');
          dot.classList.add('idle-dot');
          if (halo) halo.style.display = 'none';
        }
      }
    });

    // Update Counter Tag
    if (stepCounterDisplay) {
      stepCounterDisplay.textContent = `0${currentStep} / 0${totalSteps}`;
    }

    // Update Left Panes
    leftPanes.forEach((pane, idx) => {
      if (!pane) return;
      pane.classList.toggle('active', (idx + 1) === currentStep);
    });

    // Update Right Stage Views
    stageViews.forEach((view, idx) => {
      if (!view) return;
      view.classList.toggle('active', (idx + 1) === currentStep);
    });

    // Step-specific loops
    if (currentStep === 1) {
      if (jobSwitchTimer) clearInterval(jobSwitchTimer);
      startDockAutoSwitch();
      runScoreLoop();
    } else {
      if (scoreLoopRaf) cancelAnimationFrame(scoreLoopRaf);
      if (scoreLoopTimeout) clearTimeout(scoreLoopTimeout);
      if (dockTimer) clearInterval(dockTimer);
      startJobRolesAutoSwitch();
    }
  }

  // Stepper Click Listeners
  stepNodes.forEach((node, idx) => {
    if (node) {
      node.addEventListener('click', () => {
        goToStep(idx + 1);
      });
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
      goToStep(currentStep === 1 ? 2 : 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
      goToStep(currentStep === 2 ? 1 : 2);
    } else if (e.key === '1') {
      goToStep(1);
    } else if (e.key === '2') {
      goToStep(2);
    }
  });

  // =========================================================================
  // STEP 01: AUTO-SWITCHING DOCK ELEMENTS
  // =========================================================================

  function activateDockBtn(idx) {
    dockAutoIdx = idx;
    dockBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  }

  function startDockAutoSwitch() {
    if (dockTimer) clearInterval(dockTimer);
    dockTimer = setInterval(() => {
      if (currentStep !== 1) return;
      dockAutoIdx = (dockAutoIdx + 1) % dockBtns.length;
      activateDockBtn(dockAutoIdx);
    }, 1600);
  }

  // Allow clicking on any dock button to manually switch
  dockBtns.forEach((btn, idx) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateDockBtn(idx);
    });
  });

  // =========================================================================
  // STEP 01: CONTINUOUS 0 TO 92 ATS SCORE LOOP ANIMATION
  // =========================================================================

  function setAtsProgress(score) {
    if (!atsRingFill || !atsScoreVal) return;
    const clamped = Math.max(0, Math.min(100, score));
    const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
    atsRingFill.style.strokeDashoffset = offset;
    atsScoreVal.textContent = Math.round(clamped);

    // Sequentially illuminate the 5 criteria
    atsCheckRows.forEach((row, idx) => {
      const threshold = 18 + idx * 17; // 18, 35, 52, 69, 86
      row.classList.toggle('active-checked', clamped >= threshold);
    });

    if (clamped >= 90) {
      if (atsStatusBadge) {
        atsStatusBadge.textContent = 'Optimized';
        atsStatusBadge.classList.add('active-glow');
      }
      atsScoreVal.classList.add('celebrate');
    } else {
      if (atsStatusBadge) {
        atsStatusBadge.textContent = 'Analyzing...';
        atsStatusBadge.classList.remove('active-glow');
      }
      atsScoreVal.classList.remove('celebrate');
    }
  }

  function runScoreLoop() {
    if (isAiOptimizing || currentStep !== 1) return;

    if (scoreLoopRaf) cancelAnimationFrame(scoreLoopRaf);
    if (scoreLoopTimeout) clearTimeout(scoreLoopTimeout);

    setAtsProgress(0);

    const targetScore = 92;
    const countDuration = 1800; // 1.8s count up
    const holdDuration = 2400;  // 2.4s hold at 92
    const resetDuration = 550;  // 0.55s smooth reset
    let startTime = null;

    function countUp(timestamp) {
      if (isAiOptimizing || currentStep !== 1) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / countDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = eased * targetScore;
      setAtsProgress(currentScore);

      if (progress < 1) {
        scoreLoopRaf = requestAnimationFrame(countUp);
      } else {
        setAtsProgress(targetScore);
        scoreLoopTimeout = setTimeout(() => {
          if (isAiOptimizing || currentStep !== 1) return;

          let resetStart = null;
          function countDown(resTimestamp) {
            if (isAiOptimizing || currentStep !== 1) return;
            if (!resetStart) resetStart = resTimestamp;
            const resElapsed = resTimestamp - resetStart;
            const resProgress = Math.min(resElapsed / resetDuration, 1);
            const easedRes = Math.pow(resProgress, 2);
            const resetScore = (1 - easedRes) * targetScore;
            setAtsProgress(resetScore);

            if (resProgress < 1) {
              scoreLoopRaf = requestAnimationFrame(countDown);
            } else {
              setAtsProgress(0);
              scoreLoopTimeout = setTimeout(() => {
                runScoreLoop();
              }, 350);
            }
          }
          scoreLoopRaf = requestAnimationFrame(countDown);
        }, holdDuration);
      }
    }

    scoreLoopRaf = requestAnimationFrame(countUp);
  }

  if (btnEditAi && scanLaser) {
    btnEditAi.addEventListener('click', () => {
      isAiOptimizing = true;
      if (scoreLoopRaf) cancelAnimationFrame(scoreLoopRaf);
      if (scoreLoopTimeout) clearTimeout(scoreLoopTimeout);

      scanLaser.classList.remove('scanning');
      void scanLaser.offsetWidth; // force reflow
      scanLaser.classList.add('scanning');

      btnEditAi.innerHTML = `<span>Optimizing...</span>`;

      setTimeout(() => {
        btnEditAi.innerHTML = `<span>AI Optimized!</span>`;
        setAtsProgress(98);
        if (atsStatusBadge) {
          atsStatusBadge.textContent = 'Top 1% Match';
          atsStatusBadge.classList.add('active-glow');
        }
        showToast('AI Optimization Complete — Score boosted to 98/100');

        setTimeout(() => {
          btnEditAi.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span>Edit with AI</span>
          `;
          isAiOptimizing = false;
          runScoreLoop();
        }, 3000);
      }, 1200);
    });
  }

  // =========================================================================
  // STEP 02: AUTO-SWITCHING JOB ROLES & 1-CLICK APPLY
  // =========================================================================

  function selectJobRole(index, isUserClick = false) {
    if (!jobRows || jobRows.length === 0) return;
    jobAutoIdx = (index + jobRows.length) % jobRows.length;

    jobRows.forEach((row, i) => {
      row.classList.toggle('active', i === jobAutoIdx);
    });

    const activeRow = jobRows[jobAutoIdx];
    if (activeRow) {
      const role = activeRow.getAttribute('data-role') || activeRow.querySelector('.role-name').textContent.trim();
      const comp = activeRow.getAttribute('data-company') || activeRow.querySelector('.company-name').textContent.split('·')[0].trim();
      const match = activeRow.getAttribute('data-match') || activeRow.querySelector('.match-pill').textContent.trim();

      // Smoothly update Tailored Panel Headline & Role
      if (tailoredHeadline) {
        tailoredHeadline.style.opacity = '0';
        setTimeout(() => {
          tailoredHeadline.textContent = `Tailored for ${comp}`;
          tailoredHeadline.style.opacity = '1';
        }, 120);
      }

      if (checkRoleResumeText) {
        checkRoleResumeText.textContent = `${role} resume`;
      }

      // Synchronize floating match pill in badge 4
      if (badgeSmartMatch) {
        badgeSmartMatch.textContent = `Smart Match: ${match}`;
      }

      // Update CTA apply button label if idle
      if (btnApplyNowText && !btnApplyNow.disabled) {
        btnApplyNowText.textContent = `Apply to ${comp}`;
      }

      if (isUserClick) {
        showToast(`Selected ${role} at ${comp}`);
        // Temporarily pause auto-switching so user can view their selection
        isJobManualPaused = true;
        if (resumeJobTimer) clearTimeout(resumeJobTimer);
        resumeJobTimer = setTimeout(() => {
          isJobManualPaused = false;
        }, 4500);
      }
    }
  }

  function startJobRolesAutoSwitch() {
    if (jobSwitchTimer) clearInterval(jobSwitchTimer);
    // Sync current active row immediately
    selectJobRole(jobAutoIdx, false);

    jobSwitchTimer = setInterval(() => {
      if (currentStep !== 2 || isJobManualPaused) return;
      jobAutoIdx = (jobAutoIdx + 1) % jobRows.length;
      selectJobRole(jobAutoIdx, false);
    }, 2200);
  }

  jobRows.forEach((row, idx) => {
    row.addEventListener('click', () => {
      selectJobRole(idx, true);
    });
  });

  subTabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      subTabBtns.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  if (btnApplyNow) {
    btnApplyNow.addEventListener('click', () => {
      const activeJob = document.querySelector('.job-row.active');
      const comp = activeJob ? (activeJob.getAttribute('data-company') || activeJob.querySelector('.company-name').textContent.split('·')[0].trim()) : 'Company';

      if (airplaneGlyph) {
        airplaneGlyph.classList.remove('launch');
        void airplaneGlyph.offsetWidth;
        airplaneGlyph.classList.add('launch');
      }

      btnApplyNow.disabled = true;
      btnApplyNow.innerHTML = `<span>Submitting Application...</span>`;

      setTimeout(() => {
        btnApplyNow.innerHTML = `<span>Applied to ${comp}!</span>`;
        btnApplyNow.style.background = '#1d4ed8';
        showToast(`1-Click Application Sent to ${comp}`);

        setTimeout(() => {
          btnApplyNow.disabled = false;
          btnApplyNow.style.background = '';
          btnApplyNow.innerHTML = `
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
            <span id="btnApplyNowText">Apply to ${comp}</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          `;
          if (airplaneGlyph) airplaneGlyph.classList.remove('launch');
        }, 3000);
      }, 1000);
    });
  }

  // Initial step setup (honors hash if present, e.g. #step2)
  const initialStep = (window.location.hash === '#step2' || window.location.hash === '#2') ? 2 : 1;
  goToStep(initialStep);

})();
