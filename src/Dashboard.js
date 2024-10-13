import React, { useState, useCallback, useEffect } from 'react';
import { Model, StylesManager } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/defaultV2.min.css';

// Apply the default theme
StylesManager.applyTheme("defaultV2");

const Dashboard = () => {
    const [surveys, setSurveys] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [scheduleDate, setScheduleDate] = useState("");
    const [modalSurvey, setModalSurvey] = useState(null);
    const [editingSurvey, setEditingSurvey] = useState(null);
    const editSurvey = useCallback((surveyId) => {
        const survey = surveys.find(s => s.id === surveyId);
        if (survey) {
            const surveyModel = new Model(survey.json);
            setEditingSurvey({ ...survey, model: surveyModel });
            setModalSurvey(surveyModel);  // This will open the modal with the form
        }
    }, [surveys]);

    const createNewSurvey = useCallback(() => {
        const modalJson = {
            elements: [
                {
                    type: "text",
                    name: "surveyName",
                    title: "Survey Name",
                    isRequired: true
                },
                {
                    type: "file",
                    name: "surveyJson",
                    title: "Upload Survey JSON",
                    acceptedTypes: ".json",
                    storeDataAsText: false,
                    allowMultiple: false,
                    isRequired: true
                }
            ]
        };

        const survey = new Model(modalJson);
        survey.onUploadFiles.add((survey, options) => {
            const file = options.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    options.callback("success", [{content: jsonData, file}]);
                } catch (error) {
                    console.error("Invalid JSON file", error);
                    options.callback("error", "Invalid JSON file. Please upload a valid Survey.js definition file.");
                }
            };
            reader.readAsText(file);
        });

        survey.onComplete.add((sender, options) => {
            const { surveyName, surveyJson } = sender.data;
            if (surveyName && surveyJson) {
                const newSurvey = {
                    id: surveys.length + 1,
                    name: surveyName,
                    created: new Date().toISOString().split('T')[0],
                    status: "Draft",
                    json: surveyJson[0].content
                };
                console.log(111,{
                    surveys,
                    newSurvey,
                })
                setSurveys([...surveys, newSurvey]);
            }
            setModalSurvey(null);
        });

        setModalSurvey(survey);
    }, [surveys]);

    const createNewGroup = useCallback(() => {
        const newGroup = {
            id: groups.length + 1,
            name: `New Group ${groups.length + 1}`,
            contacts: 0
        };
        setGroups(prevGroups => [...prevGroups, newGroup]);
    }, [groups]);

    const editGroup = useCallback((groupId) => {
        // For simplicity, we'll just update the name. You can expand this as needed.
        const newName = prompt("Enter new group name:");
        if (newName) {
            setGroups(prevGroups => prevGroups.map(g =>
                g.id === groupId ? {...g, name: newName} : g
            ));
        }
    }, []);

    const deleteSurvey = useCallback((surveyId) => {
        if (window.confirm("Are you sure you want to delete this survey?")) {
            setSurveys(prevSurveys => prevSurveys.filter(s => s.id !== surveyId));
        }
    }, []);

    const deleteGroup = useCallback((groupId) => {
        if (window.confirm("Are you sure you want to delete this group?")) {
            setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
        }
    }, []);

    const previewSurvey = useCallback(() => {
        console.log("Previewing survey", selectedSurvey);
        // Implement preview logic here
    }, [selectedSurvey]);

    const sendSurvey = useCallback(() => {
        if (!selectedSurvey) {
            alert("Please select a survey to send.");
            return;
        }
        if (selectedGroups.length === 0) {
            alert("Please select at least one group to send the survey to.");
            return;
        }
        if (!scheduleDate) {
            alert("Please select a date to schedule the survey.");
            return;
        }

        console.log("Sending survey", selectedSurvey, "to groups", selectedGroups, "on", scheduleDate);
        // Implement actual sending logic here
        alert(`Survey scheduled to be sent on ${scheduleDate}`);
    }, [selectedSurvey, selectedGroups, scheduleDate]);
    console.log('222surveys',surveys);
    const dashboardJson = {
        elements: [
            {
                type: "panel",
                name: "surveyManagement",
                title: "Survey Management",
                elements: [
                    {
                        type: "html",
                        name: "createSurveyButton",
                        html: "<button class='sd-btn sd-btn--action sd-btn--primary'>+ Create New Survey</button>"
                    },
                    {
                        type: "matrixdynamic",
                        name: "surveyList",
                        rowCount: 0,
                        columns: [
                            { name: "name", title: "Name", cellType: "text",readOnly: true },
                            { name: "created", title: "Created", cellType: "text",readOnly: true },
                            { name: "status", title: "Status", cellType: "text",readOnly: true },
                            {
                                name: "actions",
                                title: "Actions",
                                cellType: "html", // Use HTML to render custom content
                                html: `<button class='edit-btn' style='background:none;border:none;cursor:pointer;'>✏️</button>`
                            }
                        ],
                    }
                ]
            },
            {
                type: "panel",
                name: "groupManagement",
                title: "Group Management",
                elements: [
                    {
                        type: "html",
                        name: "createGroupButton",
                        html: "<button class='sd-btn sd-btn--action sd-btn--secondary'>👥 Create New Group</button>"
                    },
                    {
                        type: "matrixdynamic",
                        name: "groupList",
                        rowCount: 0,
                        columns: [
                            { name: "name", title: "Name", cellType: "text" },
                            { name: "contacts", title: "Contacts", cellType: "text" },
                            {
                                name: "actions",
                                title: "Actions",
                                cellType: "text",
                                inputType: "button",
                                buttons: [
                                    { text: "✏️", value: "edit" },
                                    { text: "🗑️", value: "delete" }
                                ]
                            }
                        ],
                    }
                ]
            },
            {
                type: "panel",
                name: "sendSurvey",
                title: "Send Survey",
                elements: [
                    {
                        type: "dropdown",
                        name: "selectSurvey",
                        title: "Select Survey",
                        choices: surveys.map(s => ({ value: s.id, text: s.name })),
                        placeholder: "Choose a survey"
                    },
                    {
                        type: "checkbox",
                        name: "selectGroups",
                        title: "Select Groups",
                        choices: groups.map(g => ({ value: g.id, text: g.name })),
                    },
                    {
                        type: "text",
                        inputType: "date",
                        name: "scheduleDate",
                        title: "Schedule Date",
                        minDate: new Date().toISOString().split('T')[0] // Set minimum date to today
                    },
                    {
                        type: "html",
                        name: "surveyActions",
                        html: "<button class='sd-btn preview-button'>Preview</button><button class='sd-btn sd-btn--action sd-btn--primary send-button'>Send Survey</button>"
                    }
                ]
            }
        ]
    };
    const survey = new Model(dashboardJson);
    survey.mode = "edit";
    survey.questionsOnPageMode = "singlePage";

    // Handle matrix actions
    survey.onMatrixCellValueChanged.add((sender, options) => {
        if (options.columnName === "actions") {
            const itemId = parseInt(options.row.id);
            if (options.value === "edit") {
                if (options.question.name === "surveyList") {
                    const cellElement = options.cell.question.content;
                    cellElement.onclick = () => {
                        const surveyId = parseInt(options.row.id);
                        editSurvey(surveyId); // Open the modal to edit this survey
                    };
                } else if (options.question.name === "groupList") {
                    editGroup(itemId);
                }
            } else if (options.value === "delete") {
                if (options.question.name === "surveyList") {
                    deleteSurvey(itemId);
                } else if (options.question.name === "groupList") {
                    deleteGroup(itemId);
                }
            }
        }
    });

    // Handle value changes
    survey.onValueChanged.add((sender, options) => {
        if (options.name === "selectSurvey") {
            setSelectedSurvey(options.value);
        } else if (options.name === "selectGroups") {
            setSelectedGroups(options.value);
        } else if (options.name === "scheduleDate") {
            setScheduleDate(options.value);
        }
    });

    // Handle button clicks
    survey.onAfterRenderQuestion.add((sender, options) => {
        if (options.question.name === "createSurveyButton") {
            const button = options.htmlElement.querySelector('button');
            if (button) {
                button.onclick = createNewSurvey;
            }
        } else if (options.question.name === "createGroupButton") {
            const button = options.htmlElement.querySelector('button');
            if (button) {
                button.onclick = createNewGroup;
            }
        } else if (options.question.name === "surveyActions") {
            const previewButton = options.htmlElement.querySelector('.preview-button');
            const sendButton = options.htmlElement.querySelector('.send-button');
            if (previewButton) {
                previewButton.onclick = previewSurvey;
            }
            if (sendButton) {
                sendButton.onclick = sendSurvey;
            }
        }
    });

    survey.onMatrixAfterCellRender.add((sender, options) => {
        if (options.columnName === "actions" && options.cell.question.name === "surveyList") {
            const editButton = options.cell.querySelector('.edit-btn');
            if (editButton) {
                editButton.onclick = () => {
                    const surveyId = parseInt(options.row.id);
                    editSurvey(surveyId);  // Open the modal to edit this survey
                };
            }
        }
    });


    // Update survey data when surveys or groups change
    useEffect(() => {
        survey.getQuestionByName("surveyList").value = surveys;
        survey.getQuestionByName("groupList").value = groups;
    }, [surveys, groups]);

    useEffect(() => {
        const selectSurveyQuestion = survey.getQuestionByName("selectSurvey");
        if (selectSurveyQuestion) {
            selectSurveyQuestion.choices = surveys.map(s => ({ value: s.id, text: s.name }));
        }
    }, [surveys, survey]);
    useEffect(() => {
        const selectGroupsQuestion = survey.getQuestionByName("selectGroups");
        if (selectGroupsQuestion) {
            selectGroupsQuestion.choices = groups.map(g => ({ value: g.id, text: g.name }));
        }
    }, [groups, survey]);
    useEffect(() => {
        survey.getQuestionByName("surveyList").value = surveys;
        survey.getQuestionByName("groupList").value = groups;

        const selectSurveyQuestion = survey.getQuestionByName("selectSurvey");
        if (selectSurveyQuestion) {
            selectSurveyQuestion.choices = surveys.map(s => ({ value: s.id, text: s.name }));
        }

        const selectGroupsQuestion = survey.getQuestionByName("selectGroups");
        if (selectGroupsQuestion) {
            selectGroupsQuestion.choices = groups.map(g => ({ value: g.id, text: g.name }));
        }
    }, [surveys, groups, survey]);
    return (
        <div className="sd-root-modern">
            <h1 className="sd-title">Survey Management Dashboard</h1>
            <Survey model={survey}/>

            {modalSurvey && (
                <div className="sd-root-modern" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="sd-container-modern" style={{
                        backgroundColor: 'white',
                        borderRadius: '5px',
                        width: '500px',
                        maxWidth: '90%',
                        overflow: 'auto',
                        maxHeight: '90vh',
                        padding: '20px 30px 40px'
                    }}>
                        <h2 className="sd-title">Create New Survey</h2>
                        <Survey model={modalSurvey}/>
                    </div>
                </div>
            )}
            {editingSurvey && (
                <div className="sd-root-modern" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div className="sd-container-modern" style={{
                        backgroundColor: 'white',
                        borderRadius: '5px',
                        width: '80%',
                        maxWidth: '1000px',
                        height: '80%',
                        overflow: 'auto',
                        padding: '20px'
                    }}>
                        <h2 className="sd-title">Edit Survey: {editingSurvey.name}</h2>
                        <Survey model={editingSurvey.model}/>
                        <button onClick={() => setEditingSurvey(null)} className="sd-btn">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;