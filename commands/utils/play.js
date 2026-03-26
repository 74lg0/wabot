// Improved error handling
if (error) {
    console.error('Error:', error);
    if (stderr) {
        console.error('STDERR:', stderr);
    }
} else {
    console.log('Output:', stdout);
}