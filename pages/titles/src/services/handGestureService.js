import { knownGestures, gestureStrings } from "../util/util.js"


export default class HandGestureService {

    #gestureEstimator
    #fingerpose
    #handPoseDetection
    #handsVersion
    #detector = null 
    #gestureStrings 

    constructor({fingerpose,handPoseDetection,handsVersion, gestureStrings})
    {
        this.#gestureEstimator = new fingerpose.GestureEstimator(knownGestures)
        this.#handPoseDetection = handPoseDetection
        this.#handsVersion = handsVersion
        this.#gestureStrings = gestureStrings
    }


    async estimate(keypoints3D)
    {
        const predictions = await this.#gestureEstimator.estimate(
            this.#getLandMarksFromKeypoint(keypoints3D),
            //porcentagem de confiança
            9
        )
        return predictions.gestures
    }

    async * detectGestures(predictions) {
        for(const hand of predictions){
            if(!hand.keypoints3D) continue

            const gestures = await this.estimate(hand.keypoints3D)
            if(!gestures.length) continue;

            const result = gestures.reduce((previous, current) => (p.score > current.score ) ? previous : current)
         
            const {x, y} = hand.keypoints.find(keypoint => keypoint.name === 'index_finger_tip')
            yield {event: result.name, x,y}



            console.log('decteted',this.#gestureStrings[result.name])
        }
    }


    #getLandMarksFromKeypoint(keypoints3D)
    {
        return keypoints3D.map(keypoint => 
            [keypoint.x, keypoint.y, keypoint.z])
    }


    async estimateHands(video){
        return this.#detector.estimateHands(video, {
            flipHorizontal: true
        })
    }


    async initializeDetector(){
        if(this.#detector) return this.#detector

        
        const detectorConfig = {
            runtime: 'mediapipe',
            solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${this.#handsVersion}`,
            //full é o mais pesado e o mais preciso
            modelType: 'lite',
            maxHands: 2
        }

        this.#detector = await this.#handPoseDetection.createDetector(
            this.#handPoseDetection.SupportedModels.MediaPipeHands, 
            detectorConfig)


        return this.#detector
    }


   
}