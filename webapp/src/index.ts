import $ from 'jquery';
import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css'
import * as d3 from 'd3';
import 'particles.js';

import { voteOnCandidate, Candidate, fetchResults, Result } from './stellar';
import particlesJson from './assets/particles.json';

// @ts-ignore
// eslint-disable-next-line no-undef
particlesJS('particles-js', particlesJson);

const IDENTIFY = 'identify';
const VOTE = 'vote';
const RESULTS = 'results';
const sections = [IDENTIFY, VOTE, RESULTS];
let currentSectionIndex = 0;
let selectedCandidate: Candidate | null = null;
let tokenId: string;

function showError(message: string) {
  $('#alert-text').text(message);
  // @ts-ignore
  $('.alert').addClass('show').alert();
}

async function loginWithPz() {
  console.log('login with pz');
  const login = $('#login').val();
  const password = $('#password').val();
  const request = { login, password };
  try {
    $('#loginSpinner').removeClass('d-none');
    $('#loginWithPz').prop('disabled', true);
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const data = await response.json();
    console.log({ userId: data.userId });
    tokenId = data.userId;
    $('#userId').text(data.userId);
    $('#btnSimpleVote').prop('disabled', false);
    if (response.ok) {
      console.log('Successfully logged in');
    } else {
      console.error('Failed to login');
      throw new Error(response.statusText);
    }
    // @ts-ignore
    $('#loginWithPzModal').modal('hide');
  } finally {
    $('#loginSpinner').addClass('d-none');
    $('#loginWithPz').prop('disabled', false);
  }
}

async function performVote() {
  if (!selectedCandidate) {
    showError('Please select candidate first');
    return;
  }
  $('#btnVote').prop('disabled', true);
  $('#voteStatusSpinner').removeClass('d-none');
  try {
    await voteOnCandidate(tokenId, selectedCandidate);
    $('#btnVote').prop('disabled', true);
  } catch (e) {
    $('#btnVote').prop('disabled', false);
    $('#voteStatusSpinner').addClass('d-none');
  }
}


async function createPartiesList() {
  const partiesWithVotes = await fetchResults();
  const list = $('#party-list');
  partiesWithVotes.forEach(candidate => {
    console.log({ candidate });
    const li = $('<li/>')
      .addClass(
        'list-group-item list-group-item-action d-flex justify-content-between align-items-center',
      )
      .text(candidate.candidate.name)
      .click(() => {
        selectedCandidate = candidate.candidate;
        $('#party-list > li').removeClass('active');
        li.addClass('active');
      })
      .appendTo(list);

    $('<span/>')
      .addClass('badge badge-primary badge-pill')
      .text(candidate.votes || 0)
      .appendTo(li);

    return li;
  });
}

async function createResultsPlot() {
  const partiesWithVotes: Result[] = await fetchResults();
  // set the dimensions and margins of the graph
  const margin = { top: 30, right: 30, bottom: 70, left: 60 };
  const width = 460 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  // append the svg object to the body of the page
  d3.select('svg').remove();
  const svg = d3
    .select('#resultsPlot')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  // X axis
  const x = d3
    .scaleBand()
    .range([0, width])
    .domain(partiesWithVotes.map(candidate => candidate.candidate.name))
    .padding(0.2);
  svg
    .append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('transform', 'translate(-10,0)rotate(-45)')
    .style('text-anchor', 'end');

  // Add Y axis
  const y = d3
    .scaleLinear()
    .domain([0, partiesWithVotes.reduce((prev, current) => prev + (current.votes || 0), 0)])
    .range([height, 0]);
  svg.append('g').call(d3.axisLeft(y));

  // Bars
  svg
    .selectAll('mybar')
    .data(partiesWithVotes)
    .enter()
    .append('rect')
    .attr('x', (result: Result) => x(result.candidate.name))
    .attr('y', (result: Result) => y(result.votes || 0))
    .attr('width', x.bandwidth())
    .attr('height', (result: Result) => height - y(result.votes || 0))
    .attr('fill', '#69b3a2');
}

const onStart: { [key: string]: any } = {
  [IDENTIFY]: () => {
    const login = $('#login').val();
    if (!login) {
      $('#btnSimpleVote').prop('disabled', true);
    }
  },
  [VOTE]: () => {
  },
  [RESULTS]: () => {
    createResultsPlot();
  },
};

function render() {
  sections
    .filter((_value, index) => index !== currentSectionIndex)
    .forEach(value => $(`#${value}`).hide());
  const currentSection = sections[currentSectionIndex];
  $(`#${currentSection}`).show();
  onStart[currentSection]();
}

function showNextPage() {
  currentSectionIndex = (currentSectionIndex + 1) % sections.length;
  render();
}

function showPreviousPage() {
  currentSectionIndex = currentSectionIndex - 1 >= 0 ? currentSectionIndex - 1 : 0;
  render();
}

render();
createPartiesList();

$('.next').click(() => {
  showNextPage();
});

$('.back').click(() => {
  showPreviousPage();
});

$('#btnLoginWithPz').on('click', () => {
  console.log('clicked loginWithPz');
  loginWithPz();
});

$('#btnSimpleVote').on('click', () => {
  console.log('btnSimpleVote clicked');
});

$('#btnShowResults').on('click', () => {
  currentSectionIndex = sections.findIndex(section => section === RESULTS);
  render();
});

$('#btnVote').on('click', async e => {
  e.stopPropagation();
  try {
    await performVote();
    showNextPage();
  } catch (error) {
    console.error(error);
    showError(error.message);
  }
});
