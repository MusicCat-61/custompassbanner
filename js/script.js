class BannerEditor {
    constructor() {
        this.banner = document.getElementById('banner');
        this.draggedElement = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.coverInput = this.createCoverInput();

        this.initialPositions = {
            text: {
                number: { x: 30, y: 100 },
                name: { x: 30, y: 150 }
            },
            covers: []
        };

        this.initialize();
    }

    initialize() {
        this.setupEventListeners();
        this.setupInitialCovers();
    }

    createCoverInput() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    }

    setupEventListeners() {
        document.getElementById('generate-btn').addEventListener('click', () => this.updateBanner());
        document.getElementById('download-btn').addEventListener('click', () => this.downloadBanner());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetPositions());

        document.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.endDrag());
    }

    setupInitialCovers() {
        this.initialPositions.covers = Array.from(document.querySelectorAll('.cover')).map(cover => ({
            x: cover.offsetLeft,
            y: cover.offsetTop,
            width: cover.offsetWidth,
            height: cover.offsetHeight
        }));
    }

    updateBanner() {
        const bgInput = document.getElementById('background-upload');
        if (bgInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.banner.style.backgroundImage = `url(${e.target.result})`;
                this.updateTextColor(e.target.result);
            };
            reader.readAsDataURL(bgInput.files[0]);
        }

        const coverInput = document.getElementById('cover-upload');
        Array.from(coverInput.files).slice(0, 5).forEach((file, index) => {
            if (!document.querySelector(`.cover[data-index="${index}"]`)) {
                this.createCover(file, index);
            }
        });

        document.getElementById('pass-number').textContent =
            document.getElementById('pass-number-input').value || 'Custom Pass 7';
        document.getElementById('pass-name').textContent =
            document.getElementById('pass-name-input').value || 'AFTERLIFE';
    }

    createCover(file, index) {
        const cover = document.createElement('div');
        cover.className = 'cover';
        cover.dataset.index = index;
        cover.style.width = '150px';
        cover.style.height = '150px';
        cover.style.left = `${20 + index * 160}px`;
        cover.style.top = '20px';
        cover.style.zIndex = index === 0 ? 2 : 1;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.alt = `Cover ${index + 1}`;
        cover.appendChild(img);

        cover.addEventListener('click', (e) => {
            this.coverInput.onchange = (event) => {
                const newFile = event.target.files[0];
                if (newFile) {
                    const reader = new FileReader();
                    reader.onload = (e) => img.src = e.target.result;
                    reader.readAsDataURL(newFile);
                }
            };
            this.coverInput.click();
        });

        this.banner.appendChild(cover);
        this.initialPositions.covers[index] = {
            x: cover.offsetLeft,
            y: cover.offsetTop,
            width: cover.offsetWidth,
            height: cover.offsetHeight
        };
    }

    updateTextColor(imageUrl) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 1, 1);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;

            const textClass = brightness > 128 ? 'dark-text' : 'light-text';
            document.querySelectorAll('.resizable').forEach(el =>
                el.className = el.className.replace(/dark-text|light-text/g, textClass)
            );
        };
        img.src = imageUrl;
    }

    startDrag(e) {
        const target = e.target.closest('.resizable, .cover');
        if (!target) return;

        this.draggedElement = target;
        const rect = target.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        if (target.classList.contains('cover')) {
            document.querySelectorAll('.cover').forEach(c => c.style.zIndex = 1);
            target.style.zIndex = 3;
        }

        document.body.style.userSelect = 'none';
    }

    drag(e) {
        if (!this.draggedElement) return;

        const bannerRect = this.banner.getBoundingClientRect();
        const maxX = bannerRect.width - this.draggedElement.offsetWidth;
        const maxY = bannerRect.height - this.draggedElement.offsetHeight;

        let x = e.clientX - bannerRect.left - this.offsetX;
        let y = e.clientY - bannerRect.top - this.offsetY;

        x = Math.max(0, Math.min(x, maxX));
        y = Math.max(0, Math.min(y, maxY));

        this.draggedElement.style.left = `${x}px`;
        this.draggedElement.style.top = `${y}px`;
    }

    endDrag() {
        this.draggedElement = null;
        document.body.style.userSelect = '';
    }

    resetPositions() {
        // Сброс текста
        const number = document.getElementById('pass-number');
        const name = document.getElementById('pass-name');
        number.style.left = `${this.initialPositions.text.number.x}px`;
        number.style.top = `${this.initialPositions.text.number.y}px`;
        name.style.left = `${this.initialPositions.text.name.x}px`;
        name.style.top = `${this.initialPositions.text.name.y}px`;

        // Сброс обложек
        document.querySelectorAll('.cover').forEach((cover, index) => {
            const pos = this.initialPositions.covers[index];
            if (pos) {
                cover.style.left = `${pos.x}px`;
                cover.style.top = `${pos.y}px`;
                cover.style.width = `${pos.width}px`;
                cover.style.height = `${pos.height}px`;
                cover.style.zIndex = index === 0 ? 2 : 1;
            }
        });
    }

    downloadBanner() {
        html2canvas(this.banner, {
            scale: 2,
            logging: false,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'custom-pass-banner.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BannerEditor();
});