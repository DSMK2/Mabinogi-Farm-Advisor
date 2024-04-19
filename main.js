/*
 * Upgrade of the original Farming Advisor found here:
 * https://web.archive.org/web/20181114063001/http://mabinogi.x10.mx:80/farming_advisor 
 */
document.addEventListener('DOMContentLoaded', function () {
  // @SEE: https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available
  var isLocalStorageAvailable = (function () {
    var test = 'test'
    try {
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  })();

  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  // BEGIN: Farm Advisor
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  (function () {
    // DOM
    var DOMFormValues = document.querySelector('.farm__form--values');
    var DOMCrops = Array.prototype.slice.call(document.querySelectorAll('.farm__crop'), 0);
    var DOMCropLabels = Array.prototype.slice.call(document.querySelectorAll('.farm__crop-label'), 0);
    var DOMCropSelector = DOMFormValues.querySelector('[name="the_crop"]');
    var DOMRate = document.querySelector('.farm__growth-rate');
    var DOMTodos = Array.prototype.slice.call(document.querySelectorAll('.todo'), 0);
    var DOMTodosProgress = Array.prototype.slice.call(document.querySelectorAll('.todo__progress'), 0);
    var DOMMinutes = document.querySelector('.farm__form--time [name="time_minute"]');
    // Vars
    var cropValues = {
      tomato: {
        growthRate: 1.37,
        dehydration: 0.10,
        malnourishment: 0.25,
        bug: 0.40
      },
      cabbage: {
        growthRate: 1.11,
        dehydration: 0.20,
        malnourishment: 0.30,
        bug: 0.40
      },
      eggplant: {
        growthRate: 0.99,
        dehydration: 0.15,
        malnourishment: 0.25,
        bug: 0.40
      },
      pumpkin: {
        growthRate: 0.99,
        dehydration: 0.25,
        malnourishment: 0.35,
        bug: 0.40
      },
      strawberry: {
        growthRate: 1.04,
        dehydration: 0.40,
        malnourishment: 0.60,
        bug: 0.40
      }
    };
    var cropInputs = {
      crop: '',
      h2o: 40,
      fert: 30,
      bug: 80,
      updateMins: 0,
    };
    var updateEnabled = false;
    var updateInterval;
    var updateNext;
    var todoNext;
    var todoInterval;
    var todoTask;

    /////////////////////////////////////////////////////////////////////////////////
    // BEGIN: Local Storage Handling
    /////////////////////////////////////////////////////////////////////////////////
    function readData() {
      var farmValsRaw;
      var farmVals;

      if (!isLocalStorageAvailable) {
        console.error('localStorage not available');
        return;
      }

      farmValsRaw = localStorage.getItem('_farmVals');

      if (!farmValsRaw) {
        return;
      }

      farmVals = JSON.parse(atob(localStorage.getItem('_farmVals')));
      cropInputs.crop = farmVals.crop;

      resetCrops();
      resetCropLabels();

      document.querySelector('.farm__crop[title="' + cropInputs.crop + '" i]').classList.add('farm__crop--active');
      document.querySelector('.farm__crop-label[data-crop="' + cropInputs.crop + '" i]').classList.add('farm__crop-label--active');
      DOMCropSelector.value = cropInputs.crop;

      cropInputs.h2o = parseInt(farmVals.h2o ? farmVals.h2o : cropInputs.h2o);
      cropInputs.fert = parseInt(farmVals.fert ? farmVals.fert : cropInputs.fert);
      cropInputs.bug = parseInt(farmVals.bug ? farmVals.bug : cropInputs.bug);
      cropInputs.updateMins = parseInt(farmVals.updateMins ? farmVals.updateMins : cropInputs.updateMins);
      console.log(cropInputs);
      DOMFormValues.the_h2o.value = cropInputs.h2o;
      DOMFormValues.the_fert.value = cropInputs.fert;
      DOMFormValues.the_bug.value = cropInputs.bug;
      DOMMinutes.value = cropInputs.updateMins;

      // Insure form values are updated
      DOMCropSelector.dispatchEvent(new Event('change'));
      DOMFormValues.the_h2o.dispatchEvent(new Event('change'));
      DOMFormValues.the_fert.dispatchEvent(new Event('change'));
      DOMFormValues.the_bug.dispatchEvent(new Event('change'));
      DOMMinutes.dispatchEvent(new Event('change'));

      updateTodo();
    }

    function saveData() {
      if (!isLocalStorageAvailable) {
        console.error('localStorage not available');
        return;
      }

      localStorage.setItem('_farmVals', btoa(JSON.stringify(cropInputs)));
    }

    function updateData(options) {
      cropInputs.h2o = options.h2o ? options.h2o : cropInputs.h2o;
      cropInputs.fert = options.fert ? options.fert : cropInputs.fert;
      cropInputs.bug = options.bug ? options.bug : cropInputs.bug;

      DOMFormValues.the_h2o.value = cropInputs.h2o;
      DOMFormValues.the_fert.value = cropInputs.fert;
      DOMFormValues.the_bug.value = cropInputs.bug;

      // Insure form values are updated
      DOMCropSelector.dispatchEvent(new Event('change'));
      DOMFormValues.the_h2o.dispatchEvent(new Event('change'));
      DOMFormValues.the_fert.dispatchEvent(new Event('change'));
      DOMFormValues.the_bug.dispatchEvent(new Event('change'));

      saveData();
    }

    function resetData() {
      if (!isLocalStorageAvailable) {
        console.error('localStorage not available');
        return;
      }

      localStorage.removeItem('_farmVals');
    }
    /////////////////////////////////////////////////////////////////////////////////
    // END: Local Storage Handling
    /////////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////
    // BEGIN: Basic Features
    /////////////////////////////////////////////////////////////////////////////////
    function resetCrops() {
      DOMCrops.forEach(function (DOMCrop) {
        DOMCrop.classList.remove('farm__crop--active');
      });
    }

    function resetCropLabels() {
      DOMCropLabels.forEach(function (DOMCropLabel) {
        DOMCropLabel.classList.remove('farm__crop-label--active');
      });
    }

    function resetTodos() {
      DOMTodos.forEach(function (DOMTodo) {
        DOMTodo.classList.remove('todo--active');
      })
    }

    function setCropLabel(crop) {
      resetCropLabels();

      document.querySelector('.farm__crop-label[data-crop="' + crop + '" i]').classList.add('farm__crop-label--active');
    }

    function updateTodo() {
      var dehydration;
      var malnourishment;
      var bugs;
      var growthRate;

      if (!cropInputs.crop) {
        console.error('No crop selected');
        return;
      }

      // @SEE: https://wiki.mabinogiworld.com/view/Farming
      dehydration = cropValues[cropInputs.crop].dehydration * (100 - cropInputs.h2o) / 100;
      malnourishment = cropValues[cropInputs.crop].malnourishment * (100 - cropInputs.fert) / 100;
      bugs = cropValues[cropInputs.crop].bug * (100 - cropInputs.bug) / 100;
      growthRate = cropValues[cropInputs.crop].growthRate - dehydration - malnourishment - bugs;

      resetTodos();

      if (dehydration > malnourishment && dehydration > bugs) {
        document.querySelector('.todo--water').classList.add('todo--active');
      } else if (malnourishment > bugs) {
        document.querySelector('.todo--fertilize').classList.add('todo--active');
      } else {
        document.querySelector('.todo--bugs').classList.add('todo--active');
      }

      DOMRate.innerHTML = growthRate.toFixed(2);
    }
    /////////////////////////////////////////////////////////////////////////////////
    // END: Basic Features
    /////////////////////////////////////////////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////
    // BEGIN: Time Features
    /////////////////////////////////////////////////////////////////////////////////
    function getDatePST(date) {
      return new Date(date.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles'
      }));
    }

    function getNextUpdateTime() {
      var dateCurrent = new Date();
      var dateNext;

      // Convert to PST
      dateCurrent = getDatePST(dateCurrent);

      // Get next update date
      dateNext = new Date(dateCurrent.getFullYear(), dateCurrent.getMonth(), dateCurrent.getDate(), dateCurrent.getHours(), DOMMinutes.value, 0);

      // If minutes exceeds start minute, increment an next hour
      if (dateCurrent.getMinutes() >= dateNext.getMinutes()) {
        dateNext.setHours(dateCurrent.getHours() + 1);
      }

      return dateNext;
    }

    function decrementCropValues(elapsedHours) {
      var newH2O = 0;
      var newFert = 0;
      var newBug = 0;

      if (!cropInputs.crop) {
        console.error('No crop selected');
        return;
      }

      if (typeof elapsedHours !== 'number') {
        elapsedHours = 1;
      }

      if (elapsedHours === 0) {
        return;
      }

      newH2O = Math.floor(DOMFormValues.the_h2o.value - cropValues[cropInputs.crop].dehydration * elapsedHours);
      newFert = Math.floor(DOMFormValues.the_fert.value - cropValues[cropInputs.crop].malnourishment * elapsedHours);
      newBug = Math.floor(DOMFormValues.the_bug.value - cropValues[cropInputs.crop].bug * elapsedHours);

      DOMFormValues.the_h2o.value = newH2O < 0 ? 0 : newH2O;
      DOMFormValues.the_fert.value = newFert < 0 ? 0 : newFert;
      DOMFormValues.the_bug.value = newBug < 0 ? 0 : newBug;

      DOMFormValues.the_h2o.dispatchEvent(new Event('change'));
      DOMFormValues.the_fert.dispatchEvent(new Event('change'));
      DOMFormValues.the_bug.dispatchEvent(new Event('change'));

      saveData();
    }

    function startTodoInterval() {
      var dateCurrent = new Date();

      if (todoInterval) {
        clearInterval(todoInterval);
        todoInterval = false;
      }

      if (!updateEnabled || typeof todoTask !== 'function') {
        return;
      }

      todoInterval = setInterval(todoTask, 1000);
    }

    function stopTodoInterval() {
      if (todoInterval) {
        clearInterval(todoInterval);
        todoInterval = false;
      }
    }

    function startUpdateInterval() {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = false;
      }

      if (!updateEnabled) {
        return;
      }

      updateNext = getNextUpdateTime();

      // Run checks per minute
      updateInterval = setInterval(function () {
        var dateCurrent = new Date();

        // Convert to PST
        dateCurrent = getDatePST(dateCurrent);

        if (dateCurrent.getTime() >= updateNext.getTime()) {
          decrementCropValues();
          updateNext = getNextUpdateTime();
          console.log('Mabinogi Farm Advisor: Next Update Time: ', updateNext);
        }
      }, 60000);
    }

    function stopUpdateInterval() {
      if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = false;
      }
    }

    DOMMinutes.addEventListener('change', function () {
      updateNext = getNextUpdateTime();
      cropInputs.updateMins = DOMMinutes.value;
      saveData();
    });

    document.querySelector('.time__status-wrapper').addEventListener('click', (function () {
      var DOMStatusDisabled = document.querySelector('.time__status-wrapper .time__status--disabled');
      var DOMStatusEnabled = document.querySelector('.time__status-wrapper .time__status--enabled');

      return function (e) {
        e.preventDefault();

        if (updateEnabled) {
          DOMStatusDisabled.classList.add('time__status--active');
          DOMStatusEnabled.classList.remove('time__status--active');
          updateEnabled = false;

          // Make all todo images clickable
          DOMTodos.forEach(function (DOMTodo) {
            DOMTodo.querySelector('.todo__progress').innerHTML = '';
            DOMTodo.querySelector('.todo__image-wrapper').classList.remove('todo__image-wrapper--click');
          });

          stopUpdateInterval();
        } else {
          DOMStatusDisabled.classList.remove('time__status--active');
          DOMStatusEnabled.classList.add('time__status--active');
          updateEnabled = true;

          // Make all todo images clickable
          DOMTodos.forEach(function (DOMTodo) {
            DOMTodo.querySelector('.todo__progress').innerHTML = '';
            DOMTodo.querySelector('.todo__image-wrapper').classList.add('todo__image-wrapper--click');
          });

          startUpdateInterval();
        }
      }

    })());

    DOMTodos.forEach(function (DOMTodo) {
      var todoTotalTimeMins = parseInt(DOMTodo.getAttribute('data-update-time'));
      var todoVal = parseInt(DOMTodo.getAttribute('data-update-val'));
      var todoType = DOMTodo.getAttribute('data-type');
      var todoCurrentTime = 0;

      // Inoperable without time supplied
      if (!todoTotalTimeMins) {
        return;
      }

      function updateTodoTime() {
        var dateCurrent = new Date();
        var elapsedTodo = Math.floor((todoNext.getTime() - dateCurrent.getTime()) / 1000);
        var valUpdate = {};

        todoCurrentTime = elapsedTodo;
        todoCurrentTime = Math.max(0, todoCurrentTime);

        DOMTodosProgress.forEach(function (DOMTodoProgress) {
          DOMTodoProgress.innerHTML = todoCurrentTime;
        });

        if (dateCurrent.getTime() > todoNext.getTime()) {
          stopTodoInterval();
          DOMTodosProgress.forEach(function (DOMTodoProgress) {
            DOMTodoProgress.innerHTML = '';
          });
          valUpdate[todoType] = parseInt(cropInputs[todoType]) + parseInt(todoVal);
          updateData(valUpdate);
          todoTask = false;
        }
      }

      DOMTodo.querySelector('.todo__image-wrapper').addEventListener('click', function (e) {
        var dateCurrent = new Date();

        e.preventDefault();


        dateCurrent.setMinutes(dateCurrent.getMinutes() + todoTotalTimeMins);
        todoNext = dateCurrent;
        todoTask = updateTodoTime;

        updateTodoTime();
        startTodoInterval();
      });
    });

    window.addEventListener('focus', function () {
      var dateCurrent = new Date();
      var dateCurrentPST;
      var elapsedHours;

      if (!updateEnabled) {
        return;
      }

      // Convert to PST
      dateCurrentPST = getDatePST(dateCurrent);
      elapsedHours = Math.floor((dateCurrentPST.getTime() - updateNext.getTime()) / 3600000);

      console.log('Mabinogi Farm Advisor: ' + elapsedHours + ' elapsed')

      // Update then decrement!
      decrementCropValues(elapsedHours);

      startTodoInterval();
      startUpdateInterval();
    });


    window.addEventListener('blur', function () {
      stopTodoInterval();
      stopUpdateInterval();
    });
    /////////////////////////////////////////////////////////////////////////////////
    // END: Time Features
    /////////////////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////////////////
    // BEGIN: Events
    /////////////////////////////////////////////////////////////////////////////////
    DOMFormValues.addEventListener('change', function (e) {
      e.preventDefault();

      cropInputs.crop = DOMCropSelector.querySelector(':checked').value;
      cropInputs.h2o = DOMFormValues.the_h2o.value;
      cropInputs.fert = DOMFormValues.the_fert.value;
      cropInputs.bug = DOMFormValues.the_bug.value;

      saveData();
      updateTodo();
    });

    DOMCrops.forEach(function (DOMCrop) {
      DOMCrop.addEventListener('click', function (e) {
        var cropName = DOMCrop.getAttribute('title').toLowerCase();

        e.preventDefault();

        if (cropName === DOMCropSelector.value) {
          return;
        }

        resetCrops();
        resetCropLabels();

        DOMCrop.classList.add('farm__crop--active');
        document.querySelector('.farm__crop-label[data-crop="' + cropName + '" i]').classList.add('farm__crop-label--active');

        DOMCropSelector.value = cropName;
        DOMCropSelector.dispatchEvent(new Event('change', { bubbles: true }));
      });

      DOMCrop.addEventListener('mouseenter', function () {
        var cropName = DOMCrop.getAttribute('title').toLowerCase();
        setCropLabel(cropName);
      });

      DOMCrop.addEventListener('mouseleave', function () {
        resetCropLabels();
        document.querySelector('.farm__crop-label[data-crop="' + cropInputs.crop + '" i]').classList.add('farm__crop-label--active');
      });
    });

    document.querySelector('.farm__reset').addEventListener('click', function (e) {
      e.preventDefault();

      if (!window.confirm("Clear data?")) {
        return;
      }

      resetData();
      resetCrops();
      resetCropLabels();
      resetTodos();

      DOMCropLabels[0].classList.add('farm__crop-label--active')

      DOMTodos[0].classList.add('todo--active');
      DOMCropSelector.value = '';

      cropInputs.h2o = 40;
      cropInputs.fert = 30;
      cropInputs.bug = 80;

      DOMFormValues.the_h2o.value = cropInputs.h2o;
      DOMFormValues.the_fert.value = cropInputs.fert;
      DOMFormValues.the_bug.value = cropInputs.bug;

      DOMRate.innerHTML = '0.00';

      DOMCropSelector.dispatchEvent(new Event('change'));
      DOMFormValues.the_h2o.dispatchEvent(new Event('change'));
      DOMFormValues.the_fert.dispatchEvent(new Event('change'));
      DOMFormValues.the_bug.dispatchEvent(new Event('change'));
    });

    window.addEventListener('blur', function () {
      // Display actual selected crop on blur
      resetCropLabels();
      document.querySelector('.farm__crop-label[data-crop="' + cropInputs.crop + '" i]').classList.add('farm__crop-label--active');
    });
    /////////////////////////////////////////////////////////////////////////////////
    // END: Events
    /////////////////////////////////////////////////////////////////////////////////

    // Read saved data
    readData();
  })();
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  // END: Farm Advisor
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  // BEGIN: Info
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  (function () {
    // DOM
    var DOMInfoModal = document.querySelector('.info__modal');
    document.querySelector('.info__toggle').addEventListener('click', function (e) {
      e.preventDefault();

      DOMInfoModal.classList.add('info__modal--active');
    });

    DOMInfoModal.addEventListener('click', function (e) {
      e.preventDefault();

      DOMInfoModal.classList.remove('info__modal--active');
    });

    DOMInfoModal.querySelector('.info__content').addEventListener('click', function (e) {
      e.stopPropagation();
    });

    window.addEventListener('keydown', function (e) {

      if (e.code === 'Escape' && DOMInfoModal.classList.contains('info__modal--active')) {
        DOMInfoModal.classList.remove('info__modal--active');
      }
    });
  })();
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  // END: Info
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
});