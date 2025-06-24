document.addEventListener('DOMContentLoaded', function() {
    // Tool selection
    const toolCards = document.querySelectorAll('.tool-card');
    const toolSections = document.querySelectorAll('.tool-section');
    
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            const tool = this.getAttribute('data-tool');
            
            // Hide all tool sections
            toolSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Show selected tool section
            document.getElementById(`${tool}-tool`).classList.add('active');
            
            // Scroll to tool section
            document.getElementById(`${tool}-tool`).scrollIntoView({
                behavior: 'smooth'
            });
            
            // Initialize the tool if needed
            if (tool === 'merge') {
                initMergeTool();
            }
        });
    });
    
    // Initialize the merge tool by default
    document.getElementById('merge-tool').classList.add('active');
    initMergeTool();
});

function initMergeTool() {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const fileList = document.getElementById('file-list');
    const mergeBtn = document.getElementById('merge-btn');
    const clearBtn = document.getElementById('clear-btn');
    const resultArea = document.getElementById('result-area');
    
    let files = [];
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle file selection via button
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);
    
    // Clear all files
    clearBtn.addEventListener('click', clearFiles);
    
    // Merge files
    mergeBtn.addEventListener('click', mergePDFs);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        handleFiles({ target: { files: dt.files } });
    }
    
    function handleFiles(e) {
        const newFiles = Array.from(e.target.files).filter(file => 
            file.type === 'application/pdf'
        );
        
        if (newFiles.length === 0) {
            alert('Please select PDF files only.');
            return;
        }
        
        files = [...files, ...newFiles];
        updateFileList();
    }
    
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (files.length === 0) {
            mergeBtn.disabled = true;
            return;
        }
        
        mergeBtn.disabled = false;
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileSize = (file.size / (1024 * 1024)).toFixed(2);
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf file-icon"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${fileSize} MB</div>
                    </div>
                </div>
                <button class="remove-file" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                files.splice(index, 1);
                updateFileList();
            });
        });
    }
    
    function clearFiles() {
        files = [];
        updateFileList();
        resultArea.style.display = 'none';
        fileInput.value = '';
    }
    
    async function mergePDFs() {
        if (files.length < 2) {
            alert('Please select at least 2 PDF files to merge.');
            return;
        }
        
        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging...';
        
        try {
            const { PDFDocument } = PDFLib;
            
            // Create a new PDF document
            const mergedPdf = await PDFDocument.create();
            
            // Process each PDF file
            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                
                // Copy pages from the current PDF to the merged PDF
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            // Save the merged PDF
            const mergedPdfBytes = await mergedPdf.save();
            
            // Show result
            showResult(mergedPdfBytes);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('An error occurred while merging the PDFs. Please try again.');
        } finally {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Merge PDFs';
        }
    }
    
    function showResult(mergedPdfBytes) {
        resultArea.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>PDFs Merged Successfully!</h3>
            <p>Your combined PDF is ready to download.</p>
            <button class="btn primary download-btn" id="download-btn">Download Merged PDF</button>
        `;
        
        resultArea.style.display = 'block';
        
        // Scroll to result
        resultArea.scrollIntoView({ behavior: 'smooth' });
        
        // Add download event
        document.getElementById('download-btn').addEventListener('click', () => {
            download(mergedPdfBytes, 'merged.pdf', 'application/pdf');
        });
    }
}