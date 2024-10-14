import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {Model, StylesManager} from 'survey-core';
import {Survey} from 'survey-react-ui';
import 'survey-core/defaultV2.min.css';

StylesManager.applyTheme("defaultV2");
const PreviewModal = ({survey, onClose}) => {
    if (!survey) return null;

    return (
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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}>
                    <h2 className="sd-title" style={{margin: 0}}>Preview Survey: {survey.name}</h2>
                    <button
                        className="sd-btn"
                        style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px'}}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>
                <table className="custom-table">
                    <thead>
                    <tr>
                        <th>Property</th>
                        <th>Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Name</td>
                        <td>{survey.name}</td>
                    </tr>
                    <tr>
                        <td>Created</td>
                        <td>{survey.created}</td>
                    </tr>
                    <tr>
                        <td>Status</td>
                        <td>{survey.status}</td>
                    </tr>
                    {survey.data && Object.entries(survey.data).map(([key, value]) => (
                        <tr key={key}>
                            <td>{key}</td>
                            <td>{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
const Dashboard = () => {
    const [surveys, setSurveys] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedSurvey, setSelectedSurvey] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState([]);
    const [scheduleDate, setScheduleDate] = useState("");
    const [modalSurvey, setModalSurvey] = useState(null);
    const [editingSurvey, setEditingSurvey] = useState(null);
    const [survey, setSurvey] = useState(null);
    const [groupFormSurvey, setGroupFormSurvey] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingSurveyId, setEditingSurveyId] = useState(null);
    const [previewingSurvey, setPreviewingSurvey] = useState(null);


    const editSurvey = useCallback((surveyId) => {
        console.log("Editing survey with ID:", surveyId);
        const surveyToEdit = surveys.find(s => s.id === surveyId);
        if (surveyToEdit) {
            const surveyModel = new Model(surveyToEdit.json);

            // Set initial data
            surveyModel.data = surveyToEdit.data || {};

            // Add value changed event
            surveyModel.onValueChanged.add((sender, options) => {
                console.log("Survey value changed:", options.name, options.value);
                sender.data[options.name] = options.value;
            });

            setEditingSurvey({...surveyToEdit, model: surveyModel});
            setEditingSurveyId(surveyId);
        }
    }, [surveys]);

    const previewSurvey = useCallback(() => {
        console.log('surveys', surveys)
        if (selectedSurvey) {
            const surveyToPreview = surveys.find(s => s.id === selectedSurvey);
            if (surveyToPreview) {
                setPreviewingSurvey(surveyToPreview);
            } else {
                console.error('Selected survey not found');
            }
        } else {
            alert("Please select a survey to preview.");
        }
    }, [selectedSurvey, surveys]);
    const saveSurvey = useCallback(() => {
        if (editingSurvey && editingSurveyId) {
            console.log("Saving survey:", editingSurvey);
            console.log("Current survey data:", editingSurvey.model.data);

            const updatedSurveys = surveys.map(survey =>
                survey.id === editingSurveyId
                    ? {
                        ...survey,
                        json: editingSurvey.model.toJSON(),
                        data: editingSurvey.model.data
                    }
                    : survey
            );

            console.log("Updated surveys:", updatedSurveys);
            setSurveys(updatedSurveys);
            setEditingSurvey(null);
            setEditingSurveyId(null);
        }
    }, [editingSurvey, editingSurveyId, surveys]);


    const handleGroupRowClick = useCallback((groupId) => {
        const group = groups.find(g => g.id === groupId);
        if (group) {
            setSelectedGroup(group);
            setIsGroupDetailsModalOpen(true);
        }
    }, [groups]);

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

        const newModalSurvey = new Model(modalJson);
        newModalSurvey.onUploadFiles.add((survey, options) => {
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

        newModalSurvey.onComplete.add((sender, options) => {
            const {surveyName, surveyJson} = sender.data;
            if (surveyName && surveyJson) {
                const newSurvey = {
                    id: surveys.length + 1,
                    name: surveyName,
                    created: new Date().toISOString().split('T')[0],
                    status: "Draft",
                    json: surveyJson[0].content
                };
                setSurveys(prevSurveys => [...prevSurveys, newSurvey]);
            }
            setModalSurvey(null);
        });

        setModalSurvey(newModalSurvey);
    }, [surveys]);
    const createOrEditGroup = useCallback((groupToEdit = null) => {
        const groupFormJson = {
            title: groupToEdit ? "Edit Group" : "Create New Group",
            description: groupToEdit ? "Edit the details for this group." : "Please fill out the details for the new group.",
            pages: [{
                name: "groupDetails",
                elements: [
                    {
                        type: "text",
                        name: "groupName",
                        title: "Group Name",
                        isRequired: true,
                        maxLength: 50
                    },
                    {
                        type: "comment",
                        name: "groupDescription",
                        title: "Group Description",
                        maxLength: 500
                    },
                    {
                        type: "dropdown",
                        name: "groupType",
                        title: "Group Type",
                        isRequired: true,
                        choices: [
                            "Department", "Project Team", "Committee", "Interest Group", "Other"
                        ]
                    },
                    {
                        type: "radiogroup",
                        name: "visibility",
                        title: "Group Visibility",
                        isRequired: true,
                        choices: [
                            {value: "public", text: "Public"},
                            {value: "private", text: "Private"}
                        ]
                    },
                    {
                        type: "tagbox",
                        name: "tags",
                        title: "Group Tags",
                        choices: [
                            "Marketing", "Sales", "Engineering", "HR", "Finance", "Operations"
                        ]
                    },
                    {
                        type: "panel",
                        name: "advancedSettings",
                        title: "Advanced Settings",
                        state: "collapsed",
                        elements: [
                            {
                                type: "boolean",
                                name: "allowSelfJoin",
                                title: "Allow members to join without approval",
                                defaultValue: false
                            },
                            {
                                type: "text",
                                name: "maxMembers",
                                title: "Maximum number of members",
                                inputType: "number",
                                min: 1,
                                max: 1000
                            },
                            {
                                type: "comment",
                                name: "groupJson",
                                title: "Additional JSON Configuration",
                                placeholder: "Paste any additional JSON configuration here"
                            }
                        ]
                    }
                ]
            }],
            showQuestionNumbers: "off",
            showProgressBar: "bottom"
        };

        const newGroupFormSurvey = new Model(groupFormJson);

        if (groupToEdit) {
            newGroupFormSurvey.data = {
                groupName: groupToEdit.name,
                groupDescription: groupToEdit.description,
                groupType: groupToEdit.type,
                visibility: groupToEdit.visibility,
                tags: groupToEdit.tags,
                allowSelfJoin: groupToEdit.allowSelfJoin,
                maxMembers: groupToEdit.maxMembers,
                groupJson: JSON.stringify(groupToEdit.additionalConfig, null, 2)
            };
        }

        newGroupFormSurvey.onComplete.add((sender, options) => {
            const {
                groupName,
                groupDescription,
                groupType,
                visibility,
                tags,
                allowSelfJoin,
                maxMembers,
                groupJson
            } = sender.data;

            let additionalConfig = {};
            if (groupJson) {
                try {
                    additionalConfig = JSON.parse(groupJson);
                } catch (error) {
                    console.warn("Invalid additional JSON", error);
                }
            }

            const updatedGroup = {
                id: groupToEdit ? groupToEdit.id : Date.now(),
                name: groupName,
                description: groupDescription,
                type: groupType,
                visibility: visibility,
                tags: tags || [],
                allowSelfJoin: allowSelfJoin || false,
                maxMembers: maxMembers ? parseInt(maxMembers) : null,
                contacts: groupToEdit ? groupToEdit.contacts : 0,
                additionalConfig: additionalConfig
            };

            setGroups(prevGroups =>
                groupToEdit
                    ? prevGroups.map(g => g.id === groupToEdit.id ? updatedGroup : g)
                    : [...prevGroups, updatedGroup]
            );
            setIsGroupModalOpen(false);
            setEditingGroup(null);
        });

        setEditingGroup(groupToEdit);
        setIsGroupModalOpen(true);
        setGroupFormSurvey(newGroupFormSurvey);
    }, [setGroups]);

    const deleteGroup = useCallback((groupId) => {
        if (window.confirm("Are you sure you want to delete this group?")) {
            setGroups(prevGroups => prevGroups.filter(g => g.id !== groupId));
        }
    }, []);

    const deleteSurvey = useCallback((surveyId) => {
        if (window.confirm("Are you sure you want to delete this survey?")) {
            setSurveys(prevSurveys => prevSurveys.filter(s => s.id !== surveyId));
        }
    }, []);


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
        alert(`Survey scheduled to be sent on ${scheduleDate}`);
    }, [selectedSurvey, selectedGroups, scheduleDate]);


    const customCss = {
        "question": {
            "content": "question-content",
            "answered": "question-answered"
        },
        "panel": {
            "content": "panel-content"
        },
        "row": "custom-row",
        "header": "custom-header"
    };
    const dashboardJson = useMemo(() => ({
        pages: [{
            name: "dashboard",
            elements: [
                {
                    type: "panel",
                    name: "managementPanel",
                    elements: [
                        {
                            type: "panel",
                            name: "surveyManagement",
                            title: "Survey Management",
                            elements: [
                                {
                                    type: "html",
                                    name: "createSurveyButton",
                                    html: "<button class='sd-btn sd-btn--action sd-navigation__complete-btn 11'>+ Create New Survey</button>"
                                },
                                {
                                    type: "matrixdynamic",
                                    name: "surveyList",
                                    rowCount: 0,
                                    columns: [
                                        {name: "name", title: "Name", cellType: "text", isReadOnly: true},
                                        {name: "created", title: "Created", cellType: "text", isReadOnly: true},
                                        {name: "status", title: "Status", cellType: "text", isReadOnly: true},
                                        {
                                            name: "actions",
                                            title: "Actions",
                                            cellType: "html",
                                            html: "<button class='edit-btn' style='background: none; border: none; cursor: pointer;'>✏️</button>" +
                                                "<button class='delete-btn' style='background: none; border: none; cursor: pointer;'>🗑️</button>",
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
                                        {name: "name", title: "Name", cellType: "text"},
                                        {name: "contacts", title: "Contacts", cellType: "text"},
                                        {
                                            name: "actions",
                                            title: "Actions",
                                            cellType: "html",
                                            html: "<button class='edit-btn' style='background: none; border: none; cursor: pointer;'>✏️</button>" +
                                                "<button class='delete-btn' style='background: none; border: none; cursor: pointer;'>🗑️</button>",
                                        }
                                    ],
                                }
                            ]
                        }
                    ],
                    colCount: 2
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
                            choices: surveys.map(s => ({value: s.id, text: s.name})),
                            placeholder: "Choose a survey"
                        },
                        {
                            type: "checkbox",
                            name: "selectGroups",
                            title: "Select Groups",
                            choices: groups.map(g => ({value: g.id, text: g.name})),
                        },
                        {
                            type: "text",
                            inputType: "date",
                            name: "scheduleDate",
                            title: "Schedule Date",
                            minDate: new Date().toISOString().split('T')[0],
                            placeHolder: "Select a date"
                        },
                        {
                            type: "html",
                            name: "surveyActions",
                            html: "<button class='sd-btn preview-button'>Preview</button><button class='sd-btn sd-btn--action sd-btn--primary send-button'>Send Survey</button>"
                        }
                    ]
                }
            ]
        }]
    }), [surveys, groups]);

    useEffect(() => {
        if (!survey) {
            const newSurvey = new Model(dashboardJson);
            newSurvey.css = customCss;

            newSurvey.onUpdateQuestionCssClasses.add((sender, options) => {
                const classes = options.cssClasses;
                classes.root = "question-root";
                if (options.question.getType() === "matrixdynamic") {
                    classes.root += " matrix-dynamic-root";
                    if (options.question.name === "surveyList") {
                        classes.root += " survey-list";
                    } else if (options.question.name === "groupList") {
                        classes.root += " group-list";
                    }
                }
            });
            newSurvey.onAfterRenderQuestion.add((sender, options) => {
                if (options.question.name === "scheduleDate") {
                    const datePickerContainer = options.htmlElement.querySelector('.sd-input.sd-text');
                    if (datePickerContainer) {
                        const input = datePickerContainer.querySelector('input');
                        const icon = datePickerContainer.querySelector('.sd-input__icon');
                        if (input && icon) {
                            datePickerContainer.onclick = (event) => {
                                if (event.target !== icon) {
                                    icon.click();
                                }
                            };

                            input.onfocus = () => {
                                const currentValue = input.value;
                                setTimeout(() => {
                                    if (input.value === '') {
                                        input.value = currentValue;
                                        options.question.value = currentValue;
                                    }
                                }, 0);
                            };
                        }
                    }
                }
            });


            setSurvey(newSurvey);
        } else {
            survey.mergeData({
                selectSurvey: selectedSurvey,
                selectGroups: selectedGroups,
                scheduleDate: scheduleDate
            });
        }
    }, [dashboardJson, selectedSurvey, selectedGroups, scheduleDate]);

    useEffect(() => {
        const newSurvey = new Model(dashboardJson);

        newSurvey.mode = "edit";
        newSurvey.questionsOnPageMode = "singlePage";
        newSurvey.onValueChanged.add((sender, options) => {
            if (options.name === "selectSurvey") {
                setSelectedSurvey(options.value);
            } else if (options.name === "selectGroups") {
                setSelectedGroups(options.value);
            } else if (options.name === "scheduleDate") {
                setScheduleDate(options.value);
            }
        });
        newSurvey.onMatrixCellCreated.add((sender, options) => {
            if (options.question.name === "groupList" && options.columnName === "actions") {
                options.cellQuestion.readOnly = false;
                options.cellQuestion.afterRender = (question, element) => {
                    const editButton = element.querySelector('button[value="edit1"]');
                    const deleteButton = element.querySelector('button[value="delete1"]');
                    if (editButton) {
                        editButton.onclick = (e) => {
                            e.stopPropagation();
                            const groupId = parseInt(question.row.id);
                            const groupToEdit = groups.find(g => g.id === groupId);
                            if (groupToEdit) {
                                createOrEditGroup(groupToEdit);
                            }
                        };
                    }
                    if (deleteButton) {
                        deleteButton.onclick = (e) => {
                            e.stopPropagation();
                            const groupId = parseInt(question.row.id);
                            deleteGroup(groupId);
                        };
                    }
                };
            }
            if (options.question.name === "surveyList" && options.columnName === "actions") {
                options.cellQuestion.readOnly = false;
                options.cellQuestion.afterRender = (question, element) => {
                    const editButton = element.querySelector('.edit-btn');
                    if (editButton) {
                        editButton.onclick = () => {
                            const surveyId = parseInt(editButton.getAttribute('data-survey-id'));
                            editSurvey(surveyId);
                        };
                    }
                };
            }
        });

        newSurvey.onAfterRenderQuestion.add((sender, options) => {
            if (options.question.name === "surveyList") {
                options.htmlElement.addEventListener('click', (event) => {
                    if (event.target.matches('.sd-table__cell button.edit-btn')) {
                        const row = event.target.closest('.sd-table__row');
                        const surveyName = row.querySelector('.sd-table__cell:first-child input').value;
                        const survey = surveys.find(s => s.name === surveyName);
                        if (survey) {
                            editSurvey(survey.id);
                        } else {
                            console.error('Survey not found for name:', surveyName);
                        }
                    }
                });
            }

            if (options.question.name === "createSurveyButton") {
                const button = options.htmlElement.querySelector('button');
                if (button) {
                    button.onclick = createNewSurvey;
                }
            } else if (options.question.name === "createGroupButton") {
                const button = options.htmlElement.querySelector('button');
                if (button) {
                    button.onclick = () => createOrEditGroup();
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

        setSurvey(newSurvey);
    }, [dashboardJson, surveys, editSurvey]);

    useEffect(() => {
        if (survey) {
            survey.getQuestionByName("surveyList").value = surveys.map(s => ({
                name: s.name,
                created: s.created,
                status: s.status,
                id: s.id,
                data: s.data  // Include the data in the survey list
            }));

            const selectSurveyQuestion = survey.getQuestionByName("selectSurvey");
            if (selectSurveyQuestion) {
                selectSurveyQuestion.choices = surveys.map(s => ({value: s.id, text: s.name}));
            }
        }
    }, [surveys, survey]);

    useEffect(() => {
        if (survey) {
            survey.getQuestionByName("groupList").value = groups;

            const selectGroupsQuestion = survey.getQuestionByName("selectGroups");
            if (selectGroupsQuestion) {
                selectGroupsQuestion.choices = groups.map(g => ({value: g.id, text: g.name}));
            }
        }
    }, [groups, survey]);

    return (
        <div className="sd-root-modern">
            <h1 className="sd-title">Survey Management Dashboard</h1>
            {survey && <Survey model={survey}/>}

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
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 className="sd-title" style={{margin: 0}}>Create New Survey</h2>
                            <button
                                className="sd-btn"
                                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px'}}
                                onClick={() => setModalSurvey(null)}
                            >
                                &times;
                            </button>
                        </div>
                        <Survey model={modalSurvey}/>
                    </div>
                </div>
            )}

            {isGroupModalOpen && groupFormSurvey && (
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
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 className="sd-title"
                                style={{margin: 0}}>{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
                            <button
                                className="sd-btn"
                                style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px'}}
                                onClick={() => {
                                    setIsGroupModalOpen(false);
                                    setEditingGroup(null);
                                    setGroupFormSurvey(null);
                                }}
                            >
                                &times;
                            </button>
                        </div>
                        <Survey model={groupFormSurvey}/>
                    </div>
                </div>
            )}
            {previewingSurvey && (
                <PreviewModal
                    survey={previewingSurvey}
                    onClose={() => setPreviewingSurvey(null)}
                />
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
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 className="sd-title" style={{margin: 0}}>Edit Survey: {editingSurvey.name}</h2>
                            <div>
                                <button
                                    className="sd-btn"
                                    onClick={saveSurvey}
                                    style={{marginRight: '10px'}}
                                >
                                    Save
                                </button>
                                <button
                                    className="sd-btn"
                                    style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px'}}
                                    onClick={() => {
                                        setEditingSurvey(null);
                                        setEditingSurveyId(null);
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>
                        <Survey model={editingSurvey.model}/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;


