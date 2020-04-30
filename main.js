
class AttachmentUtil {

    constructor(filename = 'dataURI-file-') {
        this.BASE64_MARKER = ';base64,';
        this.humanFileSize = this.humanFileSize.bind(this);
        this.isDataURI = this.isDataURI.bind(this);
        this.dataURItoFile = this.dataURItoFile.bind(this);
        this.filename = filename
    }

    // Takes a file size (in bytes) and returns a human-friendly string representation.
    humanFileSize(size) {
        if (size < 1) return "0 bytes";
        // http://stackoverflow.com/a/20732091
        var factor = 1000; // Technically it should be 1024, but looks like most apps use 1000...
        var i = Math.floor(Math.log(size) / Math.log(factor));
        return (size / Math.pow(factor, i)).toFixed(1) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }

    // Does the given URL (string) look like a base64-encoded URL?
    isDataURI(url) {
        return url.split(this.BASE64_MARKER).length === 2;
    }

    // Converts a data URI string into a File object.
    dataURItoFile(dataURI) {
        if (!this.isDataURI(dataURI)) { return false; }

        // Format of a base64-encoded URL:
        // data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAAEOCAIAAAAPH1dAAAAK
        var mime = dataURI.split(this.BASE64_MARKER)[0].split(':')[1];
        var filename = this.filename + (new Date()).getTime() + '.' + mime.split('/')[1];
        var bytes = atob(dataURI.split(this.BASE64_MARKER)[1]);
        var writer = new Uint8Array(new ArrayBuffer(bytes.length));

        for (var i = 0; i < bytes.length; i++) {
            writer[i] = bytes.charCodeAt(i);
        }

        return new File([writer.buffer], filename, { type: mime });
    }
}

class CropperModal {

    constructor(options) {
        this.defaultOptions = {
            modalCanvas: '',
            modalBtnApply: '',
            modalBtnCancel: '',
            fileInput: '',
            cropperOptions: {
                aspectRatio: 16 / 9,
            },
            modal: ''
        };
        this.options = { ...this.defaultOptions, ...options };

        this.buildCropper = this.buildCropper.bind(this);
        this.clearFileInput = this.clearFileInput.bind(this);
        this.getOptions = this.getOptions.bind(this);

        this.buildCropper();
    }

    getOptions() {
        return this.options;
    }

    clearFileInput(ctrl) {
        try {
            ctrl.value = null;
        } catch (ex) { }
        if (ctrl.value) {
            ctrl.parentNode.replaceChild(ctrl.cloneNode(true), ctrl);
        }
    }

    buildCropper() {

        var appOptions = this.options;
        var clearInput = this.clearFileInput;

        var canvas = $(appOptions.modalCanvas),
            context = canvas.get(0).getContext("2d");

        $(appOptions.fileInput).on('change', function () {
            var currentInputFile = this;

            if (this.files && this.files[0]) {
                if (this.files[0].type.match(/^image\//)) {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        var img = new Image();
                        img.onload = function () {
                            context.canvas.height = img.height;
                            context.canvas.width = img.width;
                            context.drawImage(img, 0, 0);
                            canvas.cropper('destroy');
                            canvas.cropper(appOptions.cropperOptions);
                            $(appOptions.modal).modal('show');
                            $(appOptions.modalBtnApply).unbind('click');
                            $(appOptions.modalBtnApply).click(function (event) {
                                // Get a string base 64 data url
                                var croppedImageDataURL = canvas.cropper('getCroppedCanvas').toDataURL("image/png");
                                clearInput(currentInputFile);
                                // canvas.cropper('reset');
                                // canvas.cropper('destroy');
                                $(appOptions.modal).modal('hide');
                                $(appOptions.fileInput).trigger("imageCropped", [{
                                    base64: croppedImageDataURL,
                                    canvas: canvas
                                }]);
                                canvas.cropper('reset');
                            });
                            $(appOptions.modalBtnCancel).unbind('click');
                            $(appOptions.modalBtnCancel).click(function () {
                                clearInput(currentInputFile);
                                canvas.cropper('reset');
                                $(appOptions.modal).modal('hide');
                            });
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(this.files[0]);
                } else {
                    alert("Invalid file type! Please select an image file.");
                }
            } else {
                alert('No has seleccionado ningún archivo');
            }
        });
    }
}