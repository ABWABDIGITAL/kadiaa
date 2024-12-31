document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".section");
    const sidebarLinks = document.querySelectorAll(".sidebar ul li a");
    
    sidebarLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const section = document.querySelector(`#${this.dataset.section}`);
            sections.forEach(sec => sec.style.display = "none");
            section.style.display = "block";
        });
    });

    document.querySelector("#get-users-btn").addEventListener("click", fetchUsers);
    document.querySelector("#get-pending-lawyers-btn").addEventListener("click", fetchPendingLawyers);
    document.querySelector("#get-cases-btn").addEventListener("click", fetchCases);
    document.querySelector("#get-consultations-btn").addEventListener("click", fetchConsultations);

    async function fetchUsers() {
        const response = await fetch('/api/v1/users');
        const users = await response.json();
        const userList = document.querySelector("#user-list");
        userList.innerHTML = "";
        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = `${user.username} (${user.email})`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteUser(user._id));
            li.appendChild(deleteButton);
            userList.appendChild(li);
        });
    }

    async function fetchPendingLawyers() {
        const response = await fetch('/api/v1/pending-lawyers');
        const pendingLawyers = await response.json();
        const pendingLawyerList = document.querySelector("#pending-lawyer-list");
        pendingLawyerList.innerHTML = "";
        pendingLawyers.forEach(lawyer => {
            const li = document.createElement("li");
            li.textContent = `${lawyer.name} (${lawyer.specialization})`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deletePendingLawyer(lawyer._id));
            li.appendChild(deleteButton);
            pendingLawyerList.appendChild(li);
        });
    }

    async function fetchCases() {
        const response = await fetch('/api/v1/cases');
        const cases = await response.json();
        const caseList = document.querySelector("#case-list");
        caseList.innerHTML = "";
        cases.forEach(caseItem => {
            const li = document.createElement("li");
            li.textContent = `${caseItem.caseType} - ${caseItem.description}`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteCase(caseItem._id));
            li.appendChild(deleteButton);
            caseList.appendChild(li);
        });
    }

    async function fetchConsultations() {
        const response = await fetch('/api/v1/consultations');
        const consultations = await response.json();
        const consultationList = document.querySelector("#consultation-list");
        consultationList.innerHTML = "";
        consultations.forEach(consultation => {
            const li = document.createElement("li");
            li.textContent = `${consultation.consultationType} - ${consultation.details}`;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteConsultation(consultation._id));
            li.appendChild(deleteButton);
            consultationList.appendChild(li);
        });
    }

    async function deleteUser(id) {
        await fetch(`/api/v1/users/${id}`, { method: "DELETE" });
        fetchUsers();
    }

    async function deletePendingLawyer(id) {
        await fetch(`/api/v1/pending-lawyers/${id}`, { method: "DELETE" });
        fetchPendingLawyers();
    }

    async function deleteCase(id) {
        await fetch(`/api/v1/cases/${id}`, { method: "DELETE" });
        fetchCases();
    }

    async function deleteConsultation(id) {
        await fetch(`/api/v1/consultations/${id}`, { method: "DELETE" });
        fetchConsultations();
    }

    document.querySelector("#add-user-btn").addEventListener("click", async () => {
        const username = document.querySelector("#username").value;
        const email = document.querySelector("#email").value;
        await fetch('/api/v1/users', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email }),
        });
        fetchUsers();
    });

    document.querySelector("#add-pending-lawyer-btn").addEventListener("click", async () => {
        const name = document.querySelector("#lawyer-name").value;
        const specialization = document.querySelector("#specialization").value;
        await fetch('/api/v1/pending-lawyers', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, specialization }),
        });
        fetchPendingLawyers();
    });

    document.querySelector("#add-case-btn").addEventListener("click", async () => {
        const caseType = document.querySelector("#case-type").value;
        const description = document.querySelector("#description").value;
        await fetch('/api/v1/cases', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ caseType, description }),
        });
        fetchCases();
    });

    document.querySelector("#add-consultation-btn").addEventListener("click", async () => {
        const consultationType = document.querySelector("#consultation-type").value;
        const details = document.querySelector("#details").value;
        await fetch('/api/v1/consultations', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ consultationType, details }),
        });
        fetchConsultations();
    });

    // Initially hide all sections and show the first one
    sections.forEach(sec => sec.style.display = "none");
    if (sections.length > 0) sections[0].style.display = "block";
});


