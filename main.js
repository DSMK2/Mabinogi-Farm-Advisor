/*
 * Upgrade of the original Farming Advisor found here:
 * https://web.archive.org/web/20181114063001/http://mabinogi.x10.mx:80/farming_advisor 
 */
document.addEventListener('DOMContentLoaded', function () {
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  // BEGIN: Farm Advisor
  /////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////
  (function () {
    // DOM
    var DOMForm = document.querySelector('.farm__form');
    var DOMCrops = Array.prototype.slice.call(document.querySelectorAll('.farm__crop'), 0);
    var DOMCropLabels = Array.prototype.slice.call(document.querySelectorAll('.farm__crop-label'), 0);
    var DOMCropSelector = DOMForm.querySelector('[name="the_crop"]');
    var DOMRate = document.querySelector('.farm__growth-rate');
    var DOMTodos = Array.prototype.slice.call(document.querySelectorAll('.todo'), 0);
    // Vars
    var cropValues = {
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
      },
      tomato: {
        growthRate: 1.37,
        dehydration: 0.10,
        malnourishment: 0.25,
        bug: 0.40
      },
      eggplant: {
        growthRate: 0.99,
        dehydration: 0.15,
        malnourishment: 0.25,
        bug: 0.40
      },
      cabbage: {
        growthRate: 1.11,
        dehydration: 0.20,
        malnourishment: 0.30,
        bug: 0.40
      }
    };
    var cropInputs = {
      crop: '',
      h2o: 0,
      fert: 0,
      bug: 0
    }

    /////////////////////////////////////////////////////////////////////////////////
    // BEGIN: Local Storage Handling
    /////////////////////////////////////////////////////////////////////////////////
    function readData() {
      var farmValsRaw;
      var farmVals;

      if (!localStorage) {
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

      document.querySelector('.farm__crop[title="' + cropInputs.crop + '" i]').classList.add('farm__crop--active');
      document.querySelector('.farm__crop-label[data-crop="' + cropInputs.crop + '" i]').classList.add('farm__crop-label--active');
      DOMCropSelector.value = cropInputs.crop;

      cropInputs.h2o = farmVals.h2o;
      cropInputs.fert = farmVals.fert;
      cropInputs.bug = farmVals.bug;

      DOMForm.the_h2o.value = cropInputs.h2o;
      DOMForm.the_fert.value = cropInputs.fert;
      DOMForm.the_bug.value = cropInputs.bug;

      // Insure form values are updated
      DOMCropSelector.dispatchEvent(new Event('change'));
      DOMForm.the_h2o.dispatchEvent(new Event('change'));
      DOMForm.the_fert.dispatchEvent(new Event('change'));
      DOMForm.the_bug.dispatchEvent(new Event('change'));

      updateTodo();
    }

    function saveData() {
      if (!localStorage) {
        console.error('localStorage not available');
        return;
      }

      localStorage.setItem('_farmVals', btoa(JSON.stringify(cropInputs)));
    }

    function resetData() {
      if (!localStorage) {
        console.error('localStorage not available');
        return;
      }

      localStorage.removeItem('_farmVals');
    }
    /////////////////////////////////////////////////////////////////////////////////
    // END: Local Storage Handling
    /////////////////////////////////////////////////////////////////////////////////

    function resetCrops() {
      DOMCrops.forEach(function (DOMCrop) {
        DOMCrop.classList.remove('farm__crop--active');
      });

      DOMCropLabels.forEach(function (DOMCropLabel) {
        DOMCropLabel.classList.remove('farm__crop-label--active');
      });
    }

    function resetTodos() {
      DOMTodos.forEach(function (DOMTodo) {
        DOMTodo.classList.remove('todo--active');
      })
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
    // BEGIN: Events
    /////////////////////////////////////////////////////////////////////////////////
    DOMForm.addEventListener('change', function (e) {
      e.preventDefault();

      cropInputs.crop = DOMCropSelector.querySelector(':checked').value;
      cropInputs.h2o = DOMForm.the_h2o.value;
      cropInputs.fert = DOMForm.the_fert.value;
      cropInputs.bug = DOMForm.the_bug.value;

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

        DOMCrop.classList.add('farm__crop--active');
        document.querySelector('.farm__crop-label[data-crop="' + cropName + '" i]').classList.add('farm__crop-label--active');

        DOMCropSelector.value = cropName;
        DOMCropSelector.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    document.querySelector('.farm__reset').addEventListener('click', function (e) {
      e.preventDefault();

      if (!window.confirm("Clear data?")) {
        return;
      }

      resetData();
      resetCrops();
      resetTodos();

      DOMCropLabels[0].classList.add('farm__crop-label--active')

      DOMTodos[0].classList.add('todo--active');
      DOMCropSelector.value = '';

      cropInputs.h2o = 40;
      cropInputs.fert = 30;
      cropInputs.bug = 80;

      DOMForm.the_h2o.value = cropInputs.h2o;
      DOMForm.the_fert.value = cropInputs.fert;
      DOMForm.the_bug.value = cropInputs.bug;

      DOMRate.innerHTML = '0.00';

      DOMCropSelector.dispatchEvent(new Event('change'));
      DOMForm.the_h2o.dispatchEvent(new Event('change'));
      DOMForm.the_fert.dispatchEvent(new Event('change'));
      DOMForm.the_bug.dispatchEvent(new Event('change'));
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

    DOMInfoModal.addEventListener('click', function(e) {
      e.preventDefault();

      DOMInfoModal.classList.remove('info__modal--active');
    });

    window.addEventListener('keydown', function(e) {

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