export default class Camera {
    
    #currentStream;
    #streaming = false;

    #width = 640;
    #height = 0;
 
    #videoElement;
    #canvasElement;

    #takePictureButton;

    static addNewStream(stream) {
        if (!Array.isArray(window.currentStreams)) {
        window.currentStreams = [stream];
        return;
        }
        window.currentStreams = [...window.currentStreams, stream];
    }

    static stopAllStreams() {
        if (!Array.isArray(window.currentStreams)) {
        window.currentStreams = [];
        return;
        }
        window.currentStreams.forEach((stream) => {
        if (stream.active) {
            stream.getTracks().forEach((track) => track.stop());
        }
        });
    }
 
    constructor({ video, canvas, options = {} }) {
        this.#videoElement = video;
        this.#canvasElement = canvas;
    
        this.#initialListener();
    }

    #initialListener() {
        this.#videoElement.oncanplay = () => {
            if (this.#streaming) {
                return;
            }

            this.#height = (this.#videoElement.videoHeight * this.#width) / this.#videoElement.videoWidth;
            this.#canvasElement.setAttribute('width', this.#width);
            this.#canvasElement.setAttribute('height', this.#height);
        
            this.#streaming = true;
        };
    }

    #clearCanvas() {
        const context = this.#canvasElement.getContext('2d');
        context.fillStyle = '#AAAAAA';
        context.fillRect(0, 0, this.#canvasElement.width, this.#canvasElement.height);
    }

    async takePicture() {
        if (!(this.#width && this.#height)) {
        return null;
        }
        const context = this.#canvasElement.getContext('2d');
        this.#canvasElement.width = this.#width;
        this.#canvasElement.height = this.#height;
        context.drawImage(this.#videoElement, 0, 0, this.#width, this.#height);
        return await new Promise((resolve) => {
        this.#canvasElement.toBlob((blob) => resolve(blob));
        });
    }

    async #getStream() {
        try {

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                aspectRatio: 4 / 3,
                },
            });
        
            return stream;
        } catch (error) {
        console.error('#getStream: error:', error);
        return null;
        }
    }
 
    async launch() {
        this.#currentStream = await this.#getStream();
        Camera.addNewStream(this.#currentStream);
    
        this.#videoElement.srcObject = this.#currentStream;
        this.#videoElement.play();

        this.#clearCanvas();
    }
 
    stop() {
        if (this.#videoElement) {
        this.#videoElement.srcObject = null;
        this.#streaming = false;
        }
    
        if (this.#currentStream instanceof MediaStream) {
        this.#currentStream.getTracks().forEach((track) => {
            track.stop();
        });
        }

        this.#clearCanvas();
    }

    addCheeseButtonListener(selector, callback) {
        this.#takePictureButton = document.querySelector(selector);
        this.#takePictureButton.onclick = callback;
    }
}