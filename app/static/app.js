const student_id = sessionStorage.getItem('student_id')
if (!student_id) {
    window.location.href = '/';
}else{
    const student_info = document.querySelector(
        '#student-information'
    );
    studentInformation.textContent = `Creating an application for Student #${student_id}` 
}