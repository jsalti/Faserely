import {
  GestureRecognizer,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

document.addEventListener('DOMContentLoaded', () => {
  const gestureToArabic = {
      'alefا': 'ا',
      'baaب': 'ب',
      'taaت': 'ت',
      'tha2ث': 'ث',
      'jeemج': 'ج',
      '7aaح': 'ح',
      'khaaخ': 'خ',
      'dalد': 'د',
      'thalذ': 'ذ',
      'raر': 'ر',
      'zeinز': 'ز',
      'seenس': 'س',
      'sheenش': 'ش',
      'sadص': 'ص',
      'dadض': 'ض',
      '6aaط': 'ط',
      'thaظ': 'ظ',
      '3aaع': 'ع',
      'ghanغ': 'غ',
      'faaف': 'ف',
      '8afق': 'ق',
      'kafك': 'ك',
      'lamل': 'ل',
      'memم': 'م',
      'nonن': 'ن',
      'haaه': 'ه',
      'wawو': 'و',
      'yaaي': 'ي',
      'space': ' '
  };

  let gestureRecognizer;
  let runningMode = "VIDEO";
  let webcamRunning = false;
  let current_word = "";
  let enableWebcamButton = document.getElementById("webcamButton");
  let lastVideoTime = -1;
  let lastRecognizedGesture = null;
  let threshold = 0.3;
  let gesture_count = 0;
  let gesture_repeat_threshold = 10;

  const createGestureRecognizer = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://mediapipehost.s3.amazonaws.com/gesture_recognizer+(2).task", // Replace with your model URL
        delegate: "GPU"
      },
      runningMode: runningMode
    });
  };
  createGestureRecognizer();

  const video = document.getElementById("webcam");



  function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  if (hasGetUserMedia()) {
    if (enableWebcamButton) {
      enableWebcamButton.addEventListener("click", enableCam);
    } else {
      console.error("Webcam button not found");
    }
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }

  function enableCam(event) {
    
    if (!gestureRecognizer) {
      alert("الرجاء انتظار تحميل المترجم");
      return;
    }

    webcamRunning = !webcamRunning;
    enableWebcamButton.innerText = webcamRunning ? "اوقف الترجمة" : "ابدا الترجمة"
    
    if (webcamRunning) {

      const constraints = {
        video: {
            frameRate: { ideal: 30, max: 30 }
        }
    };
      navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {

        
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam2);
      });
    } else {
      disableCam();
    }
  }


  function disableCam() {
    let tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    webcamRunning = false;
    enableWebcamButton.innerText = "ابدا الترجمة";
  }

  function getGestureFromResults(results) {
    if (results.gestures && results.gestures.length > 0 && results.gestures[0].length > 0) {
      const categoryName = results.gestures[0][0].categoryName;
      return gestureToArabic[categoryName] || '';
    } else {
      return '';
    }
  }
  const makeword = document.getElementById('currentLetterBox')
  const recognizedGesturesElement = document.getElementById('recognizedGestures');

  let isGestureUpdateAllowed = true;

  let current_sentence = ''
  let trialword = ''
  async function predictWebcam2() {
      if (webcamRunning) {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const results = await gestureRecognizer.recognizeForVideo(video, Date.now());
          const predictedLetter = getGestureFromResults(results);
          
    
          if (predictedLetter && isGestureUpdateAllowed) {
            const confidence_score = parseFloat(results.gestures[0][0].score);
            
            if (predictedLetter === lastRecognizedGesture && confidence_score >= threshold) {
              gesture_count += 1;
            } else {
              gesture_count = 1;
              lastRecognizedGesture = predictedLetter;
            }
    
            if (gesture_count === gesture_repeat_threshold && predictedLetter != ' ') {
              current_word += predictedLetter;
              makeword.textContent = current_word;
              isGestureUpdateAllowed = false;
              
              setTimeout(() => {
                isGestureUpdateAllowed = true;
              }, 100);
            }else if (gesture_count === gesture_repeat_threshold && predictedLetter === ' '){
              trialword = sendToQalamAPI(current_word)
              console.log(trialword)
              current_sentence += (current_sentence.trim() === '' ? '' : ' ') + current_word
              recognizedGesturesElement.textContent = current_sentence;
              current_word = ''
              makeword.textContent = current_word;
            }
          }
        }
        window.requestAnimationFrame(predictWebcam2);
      }
    }

    const resetButtonword = document.getElementById('resetButtonword');

    resetButtonword.addEventListener('click', () => {
      current_word = '';
      makeword.textContent = current_word;
    });
    const resetButtonsentence = document.getElementById('resetButtonsentence');

    resetButtonsentence.addEventListener('click', () => {
      current_sentence = '';
      recognizedGesturesElement.textContent = current_sentence;
    });

});

